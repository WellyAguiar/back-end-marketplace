import express from 'express';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();

// Verificar se a variável de ambiente está definida
if (!process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY) {
  console.error('GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY não está definida.');
  process.exit(1); // Encerra o processo com erro
}

let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY);
} catch (error) {
  console.error('Erro ao analisar GOOGLE_CLOUD_SERVICE_ACCOUNT_KEY:', error);
  process.exit(1); // Encerra o processo com erro
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://storage-marketplace.appspot.com',
});

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
    const quantity = JSON.parse(fields.quantity?.[0] || '{}');

    console.log('Parsed Fields:', { name, description, price, category, size, color, quantity });
    console.log('Parsed Image:', image);

    if (!name || !description || !price || !category || !size || !color || !image) {
      console.error('Missing required fields:', { name, description, price, category, size, color, image });
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
              size,
              color,
              imageUrl: url,
            },
          });
          console.log('Product created:', product);

          const quantities = JSON.parse(fields.quantity?.[0] || '{}');
          console.log('Parsed Quantities:', quantities);

          for (const [key, value] of Object.entries(quantities)) {
            const [size, color] = key.split('-');
            const quantity = await prisma.quantity.create({
              data: {
                size: size.trim(),
                color: color.trim(),
                quantity: parseInt(value, 10),
                productId: product.id,
              },
            });
            console.log('Quantity created:', quantity);
          }

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
