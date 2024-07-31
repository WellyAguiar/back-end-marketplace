import express from 'express';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import admin from 'firebase-admin';
import { readFile } from 'fs/promises';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

async function initializeFirebase() {
  try {
    const filePath = path.join(process.cwd(), '/storage-marketplace-firebase-adminsdk-lvp65-262d49efa5.json'); // Ajuste o caminho conforme necessário
    const serviceAccount = JSON.parse(await readFile(filePath, 'utf8'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: 'gs://storage-marketplace.appspot.com',
    });

    console.log('Firebase initialized successfully');
  } catch (error) {
    console.error('Erro ao inicializar o Firebase:', error);
    process.exit(1);
  }
}

// Aguarde a inicialização do Firebase antes de continuar
await initializeFirebase();

const bucket = admin.storage().bucket();

router.post('/create', (req, res) => {
  console.log('Request received at /create');
  const form = formidable({
    keepExtensions: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  form.parse(req, async (err, fields, files) => {
    console.log('Fields:', fields); 
    console.log('Files:', files); 
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({ error: 'Error parsing form' });
    }

    const name = fields.name?.[0]?.trim();
    const description = fields.description?.[0]?.trim();
    const price = parseFloat(fields.price?.[0]?.trim());
    const category = fields.category?.[0]?.trim();
    const size = fields.size?.[0]?.trim();
    const color = fields.color?.[0]?.trim();
    const image = files.image?.[0];
    const quantity = parseInt(fields.quantity?.[0]?.trim(), 10);

    console.log('Parsed Fields:', { name, description, price, category, size, color, quantity });
    console.log('Parsed Image:', image);

    if (!name || !description || !price || !category || !size || !color || !image || isNaN(quantity)) {
      console.error('Missing required fields:', { name, description, price, category, size, color, image, quantity });
      return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
      const blob = bucket.file(Date.now() + path.extname(image.originalFilename));
      console.log('Blob created:', blob.name);

      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: image.mimetype,
        },
      });

      blobStream.on('error', (error) => {
        console.error('Error uploading to Firebase Storage:', error);
        res.status(500).json({ error: 'Error uploading image' });
      });

      blobStream.on('finish', async () => {
        console.log('Upload finished for:', blob.name);

        // Gerar URL público
        const options = {
          action: 'read',
          expires: '03-01-2500'
        };

        const [url] = await blob.getSignedUrl(options);
        console.log('Image URL:', url);

        try {
          const product = await prisma.product.create({
            data: {
              name,
              description,
              price,
              category,
              imageUrl: url,
              sizes: {
                connectOrCreate: {
                  where: { name: size },
                  create: { name: size }
                }
              },
              colors: {
                connectOrCreate: {
                  where: { name: color },
                  create: { name: color }
                }
              }
            },
          });
          console.log('Product created:', product);

          await prisma.quantity.create({
            data: {
              size: size,
              color: color,
              quantity: quantity,
              productId: product.id,
            },
          });

          res.status(201).json(product);
        } catch (error) {
          console.error('Error creating product in database:', error);
          res.status(500).json({ error: 'Failed to create product in database' });
        }
      });

      fs.createReadStream(image.filepath).pipe(blobStream);
    } catch (error) {
      console.error('Error handling image upload:', error);
      res.status(500).json({ error: 'Failed to handle image upload' });
    }
  });
});

export default router;
