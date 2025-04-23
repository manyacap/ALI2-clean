import { json } from '@vercel/node';

export default async function handler(req, res) {
  // Podrías integrar Google Cloud TTS aquí
  res.json({ url: 'https://example.com/audio.mp3' });
}
