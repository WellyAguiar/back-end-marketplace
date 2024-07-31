import fs from 'fs';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const router = express.Router();
const prisma = new PrismaClient();

router.use(express.json());

// Função para testar a conexão com o banco de dados
async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Connected to the database successfully!');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
}

testDatabaseConnection();

// Rota para buscar produtos
router.get('/', async (req, res) => {
  const { id, categories } = req.query;

  console.log('Received query params:', req.query);

  if (id) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id, 10) },
        include: { quantities: true, sizes: true, colors: true },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      res.json(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else if (categories) {
    const categoriesArray = categories.split(',').map(cat => cat.trim());
    try {
      const products = await prisma.product.findMany({
        where: {
          category: { in: categoriesArray },
        },
        include: { quantities: true, sizes: true, colors: true },
        orderBy: {
          createdAt: 'desc',}
      });
      res.json(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.status(400).json({ error: 'Missing required query parameters' });
  }
});

// Rota para criar produto
router.post('/create', async (req, res) => {
  const { name, description, price, category, size, color, quantity } = req.body;

  if (!name || !description || !price || !category || !size || !color) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        category,
        imageUrl: '', // Placeholder, will be updated after image upload
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

    if (quantity) {
      try {
        const quantities = JSON.parse(quantity);
        for (const [key, value] of Object.entries(quantities)) {
          const [size, color] = key.split('-');
          await prisma.quantity.create({
            data: {
              size: size.trim(),
              color: color.trim(),
              quantity: parseInt(value, 10),
              productId: product.id,
            },
          });
        }
      } catch (jsonError) {
        return res.status(400).json({ error: 'Invalid quantity format' });
      }
    }

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});


// Rota para buscar um produto específico
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: { quantities: true, sizes: true, colors: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


export default router;
