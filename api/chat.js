// Vercel Serverless Function — /api/chat
// This proxies requests to the Anthropic API so the key stays server-side.
// Set ANTHROPIC_API_KEY in your Vercel project Environment Variables.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const { messages, question } = req.body;

    const systemPrompt = `Eres un tutor médico experto preparando estudiantes para el examen FUCS (Fundación Universitaria de Ciencias de la Salud) de Colombia.

CONTEXTO DE LA PREGUNTA ACTUAL:
- Pregunta: ${question.text}
- Opciones: ${question.options.map((o, i) => \`\${String.fromCharCode(65 + i)}) \${o}\`).join(', ')}
- Respuesta correcta: ${String.fromCharCode(65 + question.correct)}) ${question.correctText}
- El estudiante respondió: ${question.userAnswer ? \`\${String.fromCharCode(65 + question.userAnswerIndex)}) \${question.userAnswer}\` : 'No ha respondido aún'}
- ${question.isCorrect ? 'RESPONDIÓ CORRECTAMENTE' : 'RESPONDIÓ INCORRECTAMENTE'}
- Explicación base: ${question.explanation}
- Especialidad: ${question.specialty}
- Tema: ${question.topic}

INSTRUCCIONES:
- Responde SIEMPRE en español
- Sé conciso pero claro (máximo 150 palabras)
- Si el estudiante pregunta sobre la pregunta actual, profundiza en la explicación
- Usa analogías clínicas cuando sea posible
- Si pregunta por otros temas médicos, responde brevemente y redirige al estudio
- Incluye tips para recordar (mnemonias, asociaciones)
- Formato: usa **negritas** para términos clave`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: systemPrompt,
        messages,
      }),
    });

    const data = await response.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const reply = data.content?.map(c => c.text || '').join('') || '';
    return res.status(200).json({ reply });
  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
