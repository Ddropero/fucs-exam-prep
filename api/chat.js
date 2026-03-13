export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ reply: '', error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply: '⚠️ API key no configurada. Ve a Vercel → Settings → Environment Variables y agrega ANTHROPIC_API_KEY con tu key de Anthropic (sk-ant-...). Luego haz Redeploy.',
      error: 'NO_API_KEY'
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(200).json({ reply: '⚠️ Error al parsear la solicitud.', error: 'PARSE_ERROR' });
  }

  var messages = body.messages;
  var question = body.question;

  if (!messages || !question) {
    return res.status(200).json({ reply: '⚠️ Datos incompletos en la solicitud.', error: 'MISSING_DATA' });
  }

  try {
    var opts = '';
    for (var i = 0; i < question.options.length; i++) {
      if (i > 0) opts += ', ';
      opts += String.fromCharCode(65 + i) + ') ' + question.options[i];
    }

    var correctLetter = String.fromCharCode(65 + question.correct);
    var studentAns = question.userAnswer
      ? String.fromCharCode(65 + question.userAnswerIndex) + ') ' + question.userAnswer
      : 'No ha respondido aún';

    var sys = 'Eres un tutor médico experto FUCS Colombia.\n\n'
      + 'PREGUNTA: ' + question.text + '\n'
      + 'OPCIONES: ' + opts + '\n'
      + 'CORRECTA: ' + correctLetter + ') ' + question.correctText + '\n'
      + 'ESTUDIANTE: ' + studentAns + '\n'
      + (question.isCorrect ? 'ACERTÓ' : 'FALLÓ') + '\n'
      + 'EXPLICACIÓN: ' + question.explanation + '\n'
      + 'ESPECIALIDAD: ' + question.specialty + '\n\n'
      + 'Responde en español, max 150 palabras, usa **negritas** para términos clave.';

    var fetchRes = await fetch('https://api.anthropic.com/v1/messages', {
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
        messages: messages,
      }),
    });

    var responseText = await fetchRes.text();
    var data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Anthropic response:', responseText.substring(0, 500));
      return res.status(200).json({
        reply: '⚠️ Error al procesar respuesta de IA. Status: ' + fetchRes.status,
        error: 'PARSE_RESPONSE'
      });
    }

    if (data.error) {
      console.error('Anthropic error:', JSON.stringify(data.error));
      return res.status(200).json({
        reply: '⚠️ Error de API: ' + (data.error.message || JSON.stringify(data.error)),
        error: 'API_ERROR'
      });
    }

    var reply = '';
    if (data.content && Array.isArray(data.content)) {
      for (var j = 0; j < data.content.length; j++) {
        if (data.content[j].text) reply += data.content[j].text;
      }
    }

    return res.status(200).json({ reply: reply || 'Sin respuesta del modelo.' });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(200).json({
      reply: '⚠️ Error del servidor: ' + (err.message || 'desconocido'),
      error: 'SERVER_ERROR'
    });
  }
}
