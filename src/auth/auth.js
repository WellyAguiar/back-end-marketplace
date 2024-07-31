import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET;

router.post('/register', async (req, res) => {
  const { email, name, password } = req.body;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, name, passwordHash },
    });
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });

  if (user && await bcrypt.compare(password, user.passwordHash)) {
    const token = jwt.sign({ userId: user.id }, SECRET, { expiresIn: '1h' });
    res.json({ token, user });
  } else {
    res.status(401).json({ error: 'Invalid email or password' });
  }
});

router.get('/me', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { userId } = jwt.verify(token, SECRET);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    res.json(user);
  } catch {
    res.status(401).json({ error: 'Unauthorized' });
  }
});

export default router;
