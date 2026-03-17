import { useState, useEffect } from 'react';
import { Icons } from './Icons';
import { THEME_EMOJIS } from '../data/questions';

const WORKER_URL = 'https://bid-proxy.ddropero.workers.dev';

export function AnalysisPanel({ results, allHistory, onBack, onHome, onPractice }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    generateAnalysis();
  }, []);

  const generateAnalysis = async () => {
    setLoading(true);
    setError(null);

    // Build performance data
    const currentQuiz = results.history;
    const byThemeData = {};
    currentQuiz.forEach(h => {
      const t = h.question.theme;
      if (!byThemeData[t]) byThemeData[t] = { correct: 0, total: 0, wrong: [] };
      byThemeData[t].total++;
      if (h.correct) {
        byThemeData[t].correct++;
      } else {
        byThemeData[t].wrong.push({
          question: h.question.question,
          userAnswer: h.question.options[h.answer],
          correctAnswer: h.question.options[h.question.correct],
          explanation: h.question.explanation,
          theme: h.question.theme,
        });
      }
    });

    // Historical data
    const historicalByTheme = {};
    allHistory.forEach(sim => {
      sim.history.forEach(h => {
        const t = h.question.theme;
        if (!historicalByTheme[t]) historicalByTheme[t] = { correct: 0, total: 0 };
        historicalByTheme[t].total++;
        if (h.correct) historicalByTheme[t].correct++;
      });
    });

    const performanceSummary = Object.entries(byThemeData).map(([theme, data]) => {
      const pct = Math.round((data.correct / data.total) * 100);
      const hist = historicalByTheme[theme];
      const histPct = hist ? Math.round((hist.correct / hist.total) * 100) : null;
      return {
        theme,
        score: `${data.correct}/${data.total} (${pct}%)`,
        historical: histPct !== null ? `${histPct}%` : 'primera vez',
        wrongQuestions: data.wrong.slice(0, 3),
      };
    }).sort((a, b) => {
      const pctA = parseInt(a.score);
      const pctB = parseInt(b.score);
      return pctA - pctB;
    });

    // Build system prompt (moved from serverless function)
    let themeDetails = '';
    performanceSummary.forEach(t => {
      themeDetails += `\n- ${t.theme}: ${t.score} (historico: ${t.historical})`;
      if (t.wrongQuestions && t.wrongQuestions.length > 0) {
        t.wrongQuestions.forEach(wq => {
          themeDetails += `\n  * FALLO: "${wq.question.substring(0, 100)}..."`;
          themeDetails += `\n    Respondio: "${wq.userAnswer}" | Correcta: "${wq.correctAnswer}"`;
          if (wq.explanation) themeDetails += `\n    Explicacion: "${wq.explanation.substring(0, 150)}..."`;
        });
      }
    });

    const currentScore = `${results.score}/${results.total} (${Math.round(results.score / results.total * 100)}%)`;
    const timeElapsed = `${Math.floor(results.elapsed / 60)}:${(results.elapsed % 60).toString().padStart(2, '0')}`;

    const systemPrompt = `Eres un tutor medico experto de la FUCS (Fundacion Universitaria de Ciencias de la Salud, Colombia). Tu rol es analizar el rendimiento del estudiante en simulacros de examen medico y dar recomendaciones de estudio CONCRETAS y PERSONALIZADAS.

DATOS DEL ESTUDIANTE:
- Puntaje actual: ${currentScore}
- Tiempo: ${timeElapsed}
- Simulacros completados: ${allHistory.length}

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

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      let data;
      try {
        data = await res.json();
      } catch {
        setError('La API no devolvio JSON valido.');
        setLoading(false);
        return;
      }

      if (data.error) {
        setError('Error de API: ' + (data.error.message || JSON.stringify(data.error)));
        setLoading(false);
        return;
      }

      let analysisText = '';
      if (data.content && Array.isArray(data.content)) {
        for (let j = 0; j < data.content.length; j++) {
          if (data.content[j].text) analysisText += data.content[j].text;
        }
      }

      if (analysisText) {
        setAnalysis(analysisText);
      } else {
        setError('Sin respuesta del modelo.');
      }
    } catch (err) {
      setError('No se pudo conectar con el tutor IA. ' + (err.message || ''));
    }
    setLoading(false);
  };

  // Compute weak themes for practice button
  const weakThemes = [];
  const byTheme = {};
  results.history.forEach(h => {
    const t = h.question.theme;
    if (!byTheme[t]) byTheme[t] = { correct: 0, total: 0 };
    byTheme[t].total++;
    if (h.correct) byTheme[t].correct++;
  });
  Object.entries(byTheme).forEach(([theme, data]) => {
    if (data.correct / data.total < 0.7) weakThemes.push(theme);
  });

  const formatAnalysis = (text) => {
    if (!text) return null;
    return text.split('\n').map((line, i) => {
      // Bold
      const parts = line.split('**').map((part, j) =>
        j % 2 === 1 ? <strong key={j} style={{ color: '#c8a2ff' }}>{part}</strong> : part
      );

      // Headers
      if (line.startsWith('### ')) {
        return <h4 key={i} style={{ fontSize: 15, fontWeight: 700, color: '#e2d5ff', marginTop: 20, marginBottom: 8 }}>{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={i} style={{ fontSize: 17, fontWeight: 700, color: '#f0e8ff', marginTop: 24, marginBottom: 10 }}>{line.replace('## ', '')}</h3>;
      }

      // Bullet points
      if (line.startsWith('- ') || line.startsWith('* ')) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, paddingLeft: 8 }}>
            <span style={{ color: '#7c3aed', flexShrink: 0 }}>&#8226;</span>
            <span>{parts}</span>
          </div>
        );
      }

      // Numbered items
      if (/^\d+\.\s/.test(line)) {
        return (
          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, paddingLeft: 8 }}>
            <span style={{ color: '#a78bfa', fontWeight: 600, flexShrink: 0, fontFamily: "'Space Mono', monospace", fontSize: 12 }}>
              {line.match(/^\d+/)[0]}.
            </span>
            <span>{parts.slice(1)}</span>
          </div>
        );
      }

      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      return <p key={i} style={{ marginBottom: 6 }}>{parts}</p>;
    });
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(139,92,246,0.08)',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'rgba(200,180,255,0.5)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        }}>
          <Icons.Back /> Resultados
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Brain />
          <span style={{ fontSize: 14, fontWeight: 600, color: '#e2d5ff' }}>Analisis IA</span>
        </div>
      </div>

      <div style={{ padding: '24px 20px', maxWidth: 680, margin: '0 auto' }}>
        {/* Score summary */}
        <div style={{
          padding: '20px', borderRadius: 14, marginBottom: 24,
          background: 'linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.06))',
          border: '1px solid rgba(139,92,246,0.15)',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: '#c4b5fd' }}>
            {Math.round(results.score / results.total * 100)}%
          </div>
          <div style={{ fontSize: 13, color: 'rgba(200,180,255,0.5)', marginTop: 4 }}>
            {results.score}/{results.total} correctas &middot; Simulacro #{allHistory.length}
          </div>
        </div>

        {/* AI Analysis */}
        {loading && (
          <div style={{
            padding: 40, textAlign: 'center',
            background: 'rgba(255,255,255,0.02)', borderRadius: 14,
            border: '1px solid rgba(255,255,255,0.04)',
          }}>
            <Icons.Loading />
            <p style={{ color: 'rgba(200,180,255,0.5)', fontSize: 14, marginTop: 16 }}>
              Claude esta analizando tu rendimiento...
            </p>
            <p style={{ color: 'rgba(200,180,255,0.3)', fontSize: 12, marginTop: 8 }}>
              Identificando debilidades y generando recomendaciones personalizadas
            </p>
          </div>
        )}

        {error && (
          <div style={{
            padding: 20, borderRadius: 14,
            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
            marginBottom: 20,
          }}>
            <p style={{ color: '#fca5a5', fontSize: 14 }}>{error}</p>
            <button onClick={generateAnalysis} style={{
              marginTop: 12, padding: '8px 16px', borderRadius: 8, border: 'none',
              background: 'rgba(248,113,113,0.15)', color: '#fca5a5', fontSize: 13,
              cursor: 'pointer', fontWeight: 600,
            }}>
              <Icons.Refresh /> Reintentar
            </button>

            {/* Fallback local analysis */}
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2d5ff', marginBottom: 12 }}>
                Analisis local (sin IA)
              </h3>
              {Object.entries(byTheme)
                .sort((a, b) => (a[1].correct / a[1].total) - (b[1].correct / b[1].total))
                .map(([theme, data]) => {
                  const pct = Math.round((data.correct / data.total) * 100);
                  return (
                    <div key={theme} style={{
                      padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                      background: pct < 50 ? 'rgba(248,113,113,0.06)' : pct < 70 ? 'rgba(250,204,21,0.06)' : 'rgba(34,197,94,0.06)',
                      border: `1px solid ${pct < 50 ? 'rgba(248,113,113,0.15)' : pct < 70 ? 'rgba(250,204,21,0.15)' : 'rgba(34,197,94,0.15)'}`,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 13, color: '#d0c8e0' }}>
                          {THEME_EMOJIS[theme] || '📋'} {theme}
                        </span>
                        <span style={{
                          fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono', monospace",
                          color: pct < 50 ? '#f87171' : pct < 70 ? '#fbbf24' : '#4ade80',
                        }}>
                          {data.correct}/{data.total} ({pct}%)
                        </span>
                      </div>
                      {pct < 70 && (
                        <p style={{ fontSize: 12, color: 'rgba(200,180,255,0.4)', marginTop: 4 }}>
                          {pct < 50 ? 'Prioridad alta: necesitas reforzar este tema' : 'Prioridad media: revisar conceptos clave'}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {analysis && (
          <div style={{
            padding: '24px', borderRadius: 14,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(139,92,246,0.12)',
            fontSize: 14, lineHeight: 1.7, color: 'rgba(200,180,255,0.8)',
            marginBottom: 24,
          }}>
            {formatAnalysis(analysis)}
          </div>
        )}

        {/* Action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {weakThemes.length > 0 && (
            <button onClick={() => onPractice(weakThemes)} style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
            }}>
              <Icons.Target /> Practicar temas debiles ({weakThemes.length} temas)
            </button>
          )}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onBack} style={{
              flex: 1, padding: '14px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
              color: 'rgba(200,180,255,0.6)', fontSize: 13, cursor: 'pointer', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icons.Back /> Resultados
            </button>
            <button onClick={onHome} style={{
              flex: 1, padding: '14px', borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
              color: 'rgba(200,180,255,0.6)', fontSize: 13, cursor: 'pointer', fontWeight: 500,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <Icons.Back /> Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
