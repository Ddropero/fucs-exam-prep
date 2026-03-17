export const config = {
  runtime: 'nodejs',
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(200).json({
      reply: 'API key no configurada. Ve a Vercel > Settings > Environment Variables y agrega ANTHROPIC_API_KEY.',
      error: 'NO_API_KEY'
    });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    return res.status(200).json({ reply: 'Error al parsear la solicitud.', error: 'PARSE_ERROR' });
  }

  const { analysisData } = body;
  if (!analysisData) {
    return res.status(200).json({ reply: 'Datos incompletos.', error: 'MISSING_DATA' });
  }

  try {
    // Build detailed performance context
    let themeDetails = '';
    if (analysisData.performanceByTheme) {
      analysisData.performanceByTheme.forEach(t => {
        themeDetails += `\n- ${t.theme}: ${t.score} (historico: ${t.historical})`;
        if (t.wrongQuestions && t.wrongQuestions.length > 0) {
          t.wrongQuestions.forEach(wq => {
            themeDetails += `\n  * FALLO: "${wq.question.substring(0, 100)}..."`;
            themeDetails += `\n    Respondio: "${wq.userAnswer}" | Correcta: "${wq.correctAnswer}"`;
            if (wq.explanation) themeDetails += `\n    Explicacion: "${wq.explanation.substring(0, 150)}..."`;
          });
        }
      });
    }

    const systemPrompt = `Eres un tutor medico experto de la FUCS (Fundacion Universitaria de Ciencias de la Salud, Colombia). Tu rol es analizar el rendimiento del estudiante en simulacros de examen medico y dar recomendaciones de estudio CONCRETAS y PERSONALIZADAS.

DATOS DEL ESTUDIANTE:
- Puntaje actual: ${analysisData.currentScore}
- Tiempo: ${analysisData.timeElapsed}
- Simulacros completados: ${analysisData.totalSimulacros}

RENDIMIENTO POR TEMA:${themeDetails}

INSTRUCCIONES:
1. Identifica los 3 temas MAS DEBILES con precision
2. Para cada tema debil, explica QUE conceptos especificos debe repasar basandote en las preguntas que fallo
3. Da un PLAN DE ESTUDIO concreto con prioridades (alta/media/baja)
4. Sugiere recursos y tecnicas de estudio especificas para medicina
5. Si el estudiante va mejorando respecto al historico, reconocelo
6. Se motivador pero honesto

FORMATO:
- Usa ## para secciones principales
- Usa ### para subsecciones
- Usa **negritas** para conceptos clave
- Usa listas numeradas para el plan de estudio
- Maximo 500 palabras
- Responde en espanol`;

    const fetchRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: 'Analiza mi rendimiento y dame recomendaciones de estudio personalizadas basadas en mis errores especificos.',
        }],
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

    let analysis = '';
    if (data.content && Array.isArray(data.content)) {
      for (let j = 0; j < data.content.length; j++) {
        if (data.content[j].text) analysis += data.content[j].text;
      }
    }

    return res.status(200).json({ analysis: analysis || 'Sin respuesta del modelo.' });

  } catch (err) {
    return res.status(200).json({
      reply: 'Error del servidor: ' + (err.message || 'desconocido'),
      error: 'SERVER_ERROR'
    });
  }
}
