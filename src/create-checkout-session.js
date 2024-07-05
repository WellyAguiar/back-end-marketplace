import Stripe from 'stripe';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { cartItems } = req.body;

    // Garantir que a URL da imagem seja completa e pública
    const transformedItems = cartItems.map((item) => ({
      price_data: {
        currency: 'brl',
        product_data: {
          name: item.name,
          images: [item.imageUrl], // Usar diretamente o item.imageUrl
        },
        unit_amount: item.price * 100,
      },
      quantity: item.quantity,
    }));

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: transformedItems,
        mode: 'payment',
        success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/canceled`,
      });

      res.status(200).json({ id: session.id });
    } catch (error) {
      console.error('Stripe error:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST' && req.url === '/webhook') {
    const payload = req.body;
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error('Webhook signature verification failed.', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        await updateProductQuantities(session);
        res.status(200).json({ received: true });
      } catch (err) {
        console.error('Error updating product quantities:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      res.status(400).end();
    }
  } else {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
  }
}

async function updateProductQuantities(session) {
  const items = session.display_items;

  for (const item of items) {
    const { custom } = item;
    const { name, description } = custom;

    // Get product information
    const product = await prisma.product.findUnique({
      where: { name: custom.name },
      include: { quantities: true },
    });

    if (product) {
      // Find the matching quantity entry for the specific size and color
      const quantityEntry = product.quantities.find(
        (quantity) => quantity.size === custom.size && quantity.color === custom.color
      );

      if (quantityEntry) {
        await prisma.quantity.update({
          where: { id: quantityEntry.id },
          data: { quantity: quantityEntry.quantity - item.quantity },
        });
      }
    }
  }
}
