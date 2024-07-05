import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Rota para buscar produtos
router.get('/', async (req, res) => {
  const { categories, id } = req.query;
  console.log(`Categories: ${categories}, ID: ${id}`);
  
  try {
    if (id) {
      const product = await prisma.product.findUnique({
        where: { id: parseInt(id, 10) },
        include: { quantities: true },
      });
      res.json(product);
    } else {
      const categoriesArray = categories ? categories.split(',') : [];
      const products = await prisma.product.findMany({
        where: {
          category: {
            in: categoriesArray,
          },
        },
        include: { quantities: true },
      });
      console.log(`Products found: ${products.length}`);
      res.json(products);
    }
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
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
        size,
        color,
      },
    });

    const quantities = JSON.parse(quantity || '{}');
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

    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

export default router;
