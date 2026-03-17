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

  const { analysisData } = body;
  if (!analysisData) {
    return Response.json({ reply: 'Datos incompletos.', error: 'MISSING_DATA' }, { headers: corsHeaders });
  }

  try {
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

    const data = await fetchRes.json();

    if (data.error) {
      return Response.json({
        reply: 'Error de API: ' + (data.error.message || JSON.stringify(data.error)),
        error: 'API_ERROR'
      }, { headers: corsHeaders });
    }

    let analysis = '';
    if (data.content && Array.isArray(data.content)) {
      for (const block of data.content) {
        if (block.text) analysis += block.text;
      }
    }

    return Response.json({ analysis: analysis || 'Sin respuesta del modelo.' }, { headers: corsHeaders });

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
