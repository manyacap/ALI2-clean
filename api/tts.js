export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { text, voice = 'es-ES-Neural2-C' } = req.body;

  try {
    const ttsResponse = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize?key=' + process.env.GOOGLE_API_KEY, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'es-ES',
          name: voice
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 1.0
        }
      })
    });

    const ttsData = await ttsResponse.json();

    if (ttsData.error) {
      console.error('[API] TTS error:', ttsData.error);
      return res.status(500).json({ error: ttsData.error.message });
    }

    const audioBuffer = Buffer.from(ttsData.audioContent, 'base64');
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(audioBuffer);
  } catch (err) {
    console.error('[API] TTS fallback error:', err);
    res.status(500).json({ error: 'Error al procesar TTS' });
  }
}
