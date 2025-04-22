export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { messages, menuItems } = req.body;

  const prompt = [
    { role: 'system', content: 'Sos Alicia, una asistente de voz amable y clara en un restaurante. Respondé con frases cortas y naturales.' },
    ...(menuItems?.length ? [{ role: 'system', content: `Menú disponible: ${menuItems.map(i => i.name).join(', ')}` }] : []),
    ...messages
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: prompt,
        temperature: 0.7,
        max_tokens: 120
      })
    });

    if (!response.ok) {
      const error = await response.text();
      return res.status(response.status).json({ error });
    }

    const data = await response.json();
    const text = data.choices[0]?.message?.content?.trim();
    return res.status(200).json({ text });
  } catch (err) {
    console.error('[API] OpenAI error:', err);
    return res.status(500).json({ error: 'Error al llamar a OpenAI' });
  }
}
