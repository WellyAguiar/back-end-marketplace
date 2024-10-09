import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import productRoutes from './products/index.js';
import authRoutes from './auth/auth.js';
import geminiRoutes from './api/gemini.js';
import stripeRoutes from './create-checkout-session.js';
import createRoutes from './products/create.js';
import incrementStockRoutes from './products/increment-stock.js';

dotenv.config();

const app = express();

// Inicializando o Prisma Client
const prisma = new PrismaClient();

app.use((req, res, next) => {
  if (req.path.includes('/src/products/create')) {
    return next(); // Pula o express.json() para esta rota
  }
  return express.json()(req, res, next);
});

// Configuração de CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://front-end-marketplace-henna.vercel.app',
  'http://localhost:3001',
  
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

app.use(express.json());

app.use('/src/products', createRoutes);
app.use('/src/products', productRoutes);
app.use('/src/products', incrementStockRoutes);
app.use('/src/auth', authRoutes);
app.use('/src/api', geminiRoutes);
app.use('/src', stripeRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});