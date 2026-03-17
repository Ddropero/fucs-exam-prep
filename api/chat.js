export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ reply: '', error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply: 'API key no configurada. Ve a Vercel > Settings > Environment Variables y agrega ANTHROPIC_API_KEY con tu key de Anthropic (sk-ant-...). Luego haz Redeploy.',
      error: 'NO_API_KEY'
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(200).json({ reply: 'Error al parsear la solicitud.', error: 'PARSE_ERROR' });
  }

  const { messages, question } = body;
  if (!messages || !question) {
    return res.status(200).json({ reply: 'Datos incompletos en la solicitud.', error: 'MISSING_DATA' });
  }

  try {
    let opts = '';
    for (let i = 0; i < question.options.length; i++) {
      if (i > 0) opts += ', ';
      opts += String.fromCharCode(65 + i) + ') ' + question.options[i];
    }

    const correctLetter = String.fromCharCode(65 + question.correct);
    const studentAns = question.userAnswer
      ? String.fromCharCode(65 + question.userAnswerIndex) + ') ' + question.userAnswer
      : 'No ha respondido aun';

    const sys = `Eres un tutor medico experto de la FUCS (Fundacion Universitaria de Ciencias de la Salud, Colombia). Ayudas estudiantes a prepararse para el examen medico.

PREGUNTA: ${question.text}
OPCIONES: ${opts}
CORRECTA: ${correctLetter}) ${question.correctText}
ESTUDIANTE: ${studentAns}
${question.isCorrect ? 'ACERTO' : 'FALLO'}
EXPLICACION: ${question.explanation || 'No disponible'}
TEMA: ${question.theme || 'General'}
AÑO: ${question.year || 'N/A'}

INSTRUCCIONES:
- Responde en espanol, max 200 palabras
- Usa **negritas** para terminos clave
- Si el estudiante fallo, explica POR QUE su respuesta fue incorrecta y el razonamiento correcto
- Relaciona con conceptos clinicos relevantes
- Si preguntan sobre un tema diferente, responde con tu conocimiento medico`;

    const fetchRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: sys,
        messages,
      }),
    });

    const responseText = await fetchRes.text();
    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      return res.status(200).json({
        reply: 'Error al procesar respuesta de IA. Status: ' + fetchRes.status,
        error: 'PARSE_RESPONSE'
      });
    }

    if (data.error) {
      return res.status(200).json({
        reply: 'Error de API: ' + (data.error.message || JSON.stringify(data.error)),
        error: 'API_ERROR'
      });
    }

    let reply = '';
    if (data.content && Array.isArray(data.content)) {
      for (let j = 0; j < data.content.length; j++) {
        if (data.content[j].text) reply += data.content[j].text;
      }
    }

    return res.status(200).json({ reply: reply || 'Sin respuesta del modelo.' });

  } catch (err) {
    return res.status(200).json({
      reply: 'Error del servidor: ' + (err.message || 'desconocido'),
      error: 'SERVER_ERROR'
    });
  }
}
