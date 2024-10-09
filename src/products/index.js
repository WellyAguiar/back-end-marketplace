import fs from 'fs';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const router = express.Router();
const prisma = new PrismaClient();

router.use(express.json());

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

router.get('/', async (req, res) => {
  const { id, categories } = req.query;

  console.log('Received query params:', req.query);

  if (id) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id, 10) },
        include: { productVariants: { include: { size: true, color: true } } },
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
        include: { productVariants: { include: { size: true, color: true } } },
        orderBy: {
          createdAt: 'desc',
        }
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

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id, 10) },
      include: { productVariants: { include: { size: true, color: true } } },
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
