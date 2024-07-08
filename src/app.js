import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import productRoutes from './products/index.js';
import authRoutes from './auth/register.js';
import geminiRoutes from './api/gemini.js';
import stripeRoutes from './create-checkout-session.js';
import createRoutes from './products/create.js';

dotenv.config();

const app = express();

app.use((req, res, next) => {
    if (req.path.includes('/src/products/create')) {
      return next(); // Pula o express.json() para esta rota
    }
    return express.json()(req, res, next);
  });
  
app.use(cors({
  origin: [
    process.env.FRONTEND_URL,
    'https://front-end-marketplace-henna.vercel.app',
    'http://localhost:3001',
  ],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

app.use(express.json()); // Usando express.json() ao invés de bodyParser.json()

app.use('/src/products', createRoutes);
app.use('/src/products', productRoutes);
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
