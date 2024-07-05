// controllers/authController.js
import prisma from '../src/prismaClient.js';

export const registerUser = async (req, res) => {
  const { email, name } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: 'User registration failed' });
  }
};
