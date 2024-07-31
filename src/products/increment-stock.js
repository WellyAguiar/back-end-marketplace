import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/increment-stock', async (req, res) => {
  const { productId, size, color, quantity } = req.body;

  if (!productId || !size || !color || !quantity) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const existingQuantity = await prisma.quantity.findFirst({
      where: {
        productId: parseInt(productId, 10),
        size,
        color
      }
    });

    if (existingQuantity) {
      await prisma.quantity.update({
        where: { id: existingQuantity.id },
        data: {
          quantity: existingQuantity.quantity + parseInt(quantity, 10)
        }
      });
    } else {
      await prisma.quantity.create({
        data: {
          productId: parseInt(productId, 10),
          size,
          color,
          quantity: parseInt(quantity, 10)
        }
      });
    }

    res.status(200).json({ message: 'Estoque atualizado com sucesso' });
  } catch (error) {
    console.error('Error incrementing stock:', error);
    res.status(500).json({ error: 'Erro ao incrementar estoque' });
  }
});

export default router;
