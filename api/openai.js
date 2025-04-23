import { json } from '@vercel/node';

export default async function handler(req, res) {
  const { prompt } = JSON.parse(req.body);
  // Aquí llamarías a OpenAI con tu lógica real
  res.json({ reply: 'Respuesta simulada para: ' + prompt });
}
