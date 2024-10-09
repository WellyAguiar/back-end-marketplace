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
    // Encontra ou cria o tamanho
    const sizeData = await prisma.size.upsert({
      where: { name: size },
      update: {},
      create: { name: size }
    });

    // Encontra ou cria a cor
    const colorData = await prisma.color.upsert({
      where: { name: color },
      update: {},
      create: { name: color }
    });

    // Encontra a variante do produto
    const existingVariant = await prisma.productVariant.findFirst({
      where: {
        productId: parseInt(productId, 10),
        sizeId: sizeData.id,
        colorId: colorData.id,
      }
    });

    if (existingVariant) {
      // Incrementa a quantidade se a variante já existir
      await prisma.productVariant.update({
        where: { id: existingVariant.id },
        data: {
          quantity: existingVariant.quantity + parseInt(quantity, 10)
        }
      });
    } else {
      // Cria uma nova variante se ela não existir
      await prisma.productVariant.create({
        data: {
          productId: parseInt(productId, 10),
          sizeId: sizeData.id,
          colorId: colorData.id,
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
