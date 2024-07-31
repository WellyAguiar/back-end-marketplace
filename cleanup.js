import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  try {
    // Delete all records from the tables
    await prisma.orderProduct.deleteMany();
    await prisma.order.deleteMany();
    await prisma.quantity.deleteMany();
    await prisma.color.deleteMany();
    await prisma.size.deleteMany();
    await prisma.product.deleteMany();
    await prisma.user.deleteMany();

    console.log('Database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
