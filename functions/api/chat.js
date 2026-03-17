export async function onRequestPost(context) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  const apiKey = context.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json({
      reply: 'API key no configurada. Ve a Cloudflare Pages > Settings > Environment Variables y agrega ANTHROPIC_API_KEY.',
      error: 'NO_API_KEY'
    }, { headers: corsHeaders });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ reply: 'Error al parsear la solicitud.', error: 'PARSE_ERROR' }, { headers: corsHeaders });
  }

  const { messages, question } = body;
  if (!messages || !question) {
    return Response.json({ reply: 'Datos incompletos en la solicitud.', error: 'MISSING_DATA' }, { headers: corsHeaders });
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

    const data = await fetchRes.json();

    if (data.error) {
      return Response.json({
        reply: 'Error de API: ' + (data.error.message || JSON.stringify(data.error)),
        error: 'API_ERROR'
      }, { headers: corsHeaders });
    }

    let reply = '';
    if (data.content && Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.text) reply += block.text;
      }
    }

    return Response.json({ reply: reply || 'Sin respuesta del modelo.' }, { headers: corsHeaders });

  } catch (err) {
    return Response.json({
      reply: 'Error del servidor: ' + (err.message || 'desconocido'),
      error: 'SERVER_ERROR'
    }, { headers: corsHeaders });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
