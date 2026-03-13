export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured. Add it in Vercel Settings > Environment Variables.' });
  }

  try {
    const { messages, question } = req.body;

    if (!messages || !question) {
      return res.status(400).json({ error: 'Missing messages or question in request body' });
    }

    const optionsList = question.options
      .map(function(o, i) { return String.fromCharCode(65 + i) + ') ' + o; })
      .join(', ');

    const correctLetter = String.fromCharCode(65 + question.correct);
    const studentAnswer = question.userAnswer
      ? String.fromCharCode(65 + question.userAnswerIndex) + ') ' + question.userAnswer
      : 'No ha respondido aún';

    const systemPrompt = [
      'Eres un tutor médico experto preparando estudiantes para el examen FUCS (Fundación Universitaria de Ciencias de la Salud) de Colombia.',
      '',
      'CONTEXTO DE LA PREGUNTA ACTUAL:',
      '- Pregunta: ' + question.text,
      '- Opciones: ' + optionsList,
      '- Respuesta correcta: ' + correctLetter + ') ' + question.correctText,
      '- El estudiante respondió: ' + studentAnswer,
      '- ' + (question.isCorrect ? 'RESPONDIÓ CORRECTAMENTE' : 'RESPONDIÓ INCORRECTAMENTE'),
      '- Explicación base: ' + question.explanation,
      '- Especialidad: ' + question.specialty,
      '- Tema: ' + question.topic,
      '',
      'INSTRUCCIONES:',
      '- Responde SIEMPRE en español',
      '- Sé conciso pero claro (máximo 150 palabras)',
      '- Si el estudiante pregunta sobre la pregunta actual, profundiza en la explicación',
      '- Usa analogías clínicas cuando sea posible',
      '- Incluye tips para recordar (mnemonias, asociaciones)',
      '- Formato: usa **negritas** para términos clave'
    ].join('\n');

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
        messages: messages,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error('Anthropic API error:', JSON.stringify(data.error));
      return res.status(500).json({ error: data.error.message || 'Anthropic API error' });
    }

    const reply = (data.content || [])
      .map(function(c) { return c.text || ''; })
      .join('');

    return res.status(200).json({ reply: reply });
  } catch (error) {
    console.error('Chat API error:', error.message || error);
    return res.status(500).json({ error: 'Internal server error: ' + (error.message || 'unknown') });
  }
}
