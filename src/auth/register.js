import { registerUser } from '../../controllers/authController.js';

console.log('Register User Handler loaded successfully');

export default async function handler(req, res) {
  console.log('Handler called');
  if (req.method === 'POST') {
    console.log('POST method detected');
    await registerUser(req, res);
  } else {
    console.log('Method not allowed');
    res.status(405).end(); // Method Not Allowed
  }
}
