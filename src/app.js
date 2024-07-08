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
  
// Configuração de CORS
app.use(cors({
  origin: [
    process.env.FRONTEND_URL, // Certifique-se de que esta variável está configurada corretamente
    'https://front-end-marketplace-henna.vercel.app',
    'http://localhost:3001',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true, // Adicione isso se precisar enviar cookies ou autenticação de sessão
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
