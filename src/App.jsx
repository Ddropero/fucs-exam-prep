import { useState, useEffect } from 'react';
import { QUESTION_BANK, THEMES, THEME_EMOJIS } from './data/questions';
import { Icons } from './components/Icons';
import { AITutor } from './components/AITutor';
import { AnalysisPanel } from './components/AnalysisPanel';
import { LoginScreen } from './components/LoginScreen';

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ─── Home ───
function HomeScreen({ onStartQuiz, onStudy, history }) {
  const [selectedThemes, setSelectedThemes] = useState([]);
  const [quizSize, setQuizSize] = useState(20);

  const toggleTheme = (t) => {
    setSelectedThemes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );
  };

  const themeStats = THEMES.map(t => ({
    name: t,
    total: QUESTION_BANK.filter(q => q.theme === t).length,
    emoji: THEME_EMOJIS[t] || '📋',
  }));

  // Calculate weak areas from history
  const weakAreas = getWeakAreas(history);

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Hero */}
      <div style={{
        padding: '60px 24px 40px', textAlign: 'center', position: 'relative',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.15) 0%, transparent 70%)',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")", opacity: 0.5 }} />
        <div style={{ position: 'relative' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 20,
            background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)',
            fontSize: 12, fontWeight: 500, color: '#a78bfa', marginBottom: 20,
            letterSpacing: '0.05em', textTransform: 'uppercase',
          }}>
            <Icons.Sparkle /> Potenciado por Claude Sonnet 4.6
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 700,
            background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1.1, margin: '0 0 16px',
            fontFamily: "'Space Mono', monospace",
          }}>
            FUCS<br />EXAM PREP
          </h1>
          <p style={{ fontSize: 16, color: 'rgba(200,180,255,0.6)', maxWidth: 420, margin: '0 auto', lineHeight: 1.6 }}>
            Simulacros 2019-2024 &middot; {QUESTION_BANK.length} preguntas &middot; Tutor IA &middot; Analisis de debilidades
          </p>
        </div>
      </div>

      {/* Stats Strip */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 32, padding: '20px 24px',
        borderTop: '1px solid rgba(139,92,246,0.08)',
        borderBottom: '1px solid rgba(139,92,246,0.08)',
      }}>
        {[
          { label: 'Preguntas', value: QUESTION_BANK.length },
          { label: 'Temas', value: THEMES.length },
          { label: 'Simulacros', value: history.length },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#c4b5fd', fontFamily: "'Space Mono', monospace" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: 'rgba(200,180,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Weak areas alert */}
      {weakAreas.length > 0 && (
        <div style={{ padding: '16px 24px', maxWidth: 640, margin: '0 auto' }}>
          <div style={{
            padding: '16px 20px', borderRadius: 14,
            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#f87171', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icons.Target /> Areas que necesitan repaso
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {weakAreas.slice(0, 5).map(a => (
                <button key={a.theme} onClick={() => {
                  setSelectedThemes([a.theme]);
                  setQuizSize(10);
                }} style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  border: '1px solid rgba(248,113,113,0.2)',
                  background: 'rgba(248,113,113,0.08)', color: '#fca5a5',
                }}>
                  {THEME_EMOJIS[a.theme] || '📋'} {a.theme} ({a.pct}%)
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Theme Selection */}
      <div style={{ padding: '32px 24px', maxWidth: 640, margin: '0 auto' }}>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(200,180,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>
          Filtrar por tema
        </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28 }}>
          {themeStats.map(s => {
            const active = selectedThemes.includes(s.name);
            return (
              <button key={s.name} onClick={() => toggleTheme(s.name)} style={{
                padding: '8px 14px', borderRadius: 10,
                border: `1px solid ${active ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)'}`,
                background: active ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                color: active ? '#c4b5fd' : 'rgba(200,180,255,0.5)',
                fontSize: 13, cursor: 'pointer', transition: 'all 0.2s', fontWeight: 500,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span>{s.emoji}</span> {s.name}
                <span style={{ fontSize: 11, opacity: 0.5 }}>({s.total})</span>
              </button>
            );
          })}
        </div>

        {/* Quiz Size */}
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'rgba(200,180,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Preguntas por simulacro
        </h2>
        <div style={{ display: 'flex', gap: 8, marginBottom: 36 }}>
          {[5, 10, 20, 50, 100].map(n => (
            <button key={n} onClick={() => setQuizSize(n)} style={{
              padding: '8px 18px', borderRadius: 10,
              border: `1px solid ${quizSize === n ? 'rgba(139,92,246,0.5)' : 'rgba(255,255,255,0.06)'}`,
              background: quizSize === n ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
              color: quizSize === n ? '#c4b5fd' : 'rgba(200,180,255,0.5)',
              fontSize: 14, fontWeight: 600, cursor: 'pointer',
              fontFamily: "'Space Mono', monospace", transition: 'all 0.2s',
            }}>
              {n}
            </button>
          ))}
        </div>

        {/* Start */}
        <button onClick={() => onStartQuiz(selectedThemes, quizSize)} style={{
          width: '100%', padding: '18px 24px', borderRadius: 14, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #7c3aed, #6366f1, #4f46e5)',
          color: '#fff', fontSize: 16, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          boxShadow: '0 4px 20px rgba(124,58,237,0.3), inset 0 1px 0 rgba(255,255,255,0.1)',
          letterSpacing: '0.02em',
        }}>
          <Icons.Target /> Iniciar Simulacro
        </button>

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          <button onClick={() => onStartQuiz([], 20)} style={{
            flex: 1, padding: '14px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(200,180,255,0.6)', fontSize: 13, cursor: 'pointer', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icons.Refresh /> Aleatorio rapido
          </button>
          <button onClick={onStudy} style={{
            flex: 1, padding: '14px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.03)',
            color: 'rgba(200,180,255,0.6)', fontSize: 13, cursor: 'pointer', fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icons.Book /> Modo estudio
          </button>
        </div>

        {/* Weak areas practice button */}
        {weakAreas.length > 0 && (
          <button onClick={() => {
            const weakThemes = weakAreas.slice(0, 3).map(a => a.theme);
            onStartQuiz(weakThemes, 20);
          }} style={{
            width: '100%', padding: '14px', borderRadius: 12, marginTop: 10,
            border: '1px solid rgba(248,113,113,0.2)',
            background: 'rgba(248,113,113,0.06)',
            color: '#fca5a5', fontSize: 13, cursor: 'pointer', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <Icons.Target /> Practicar temas debiles
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Quiz ───
function QuizScreen({ questions, onFinish, onExit }) {
  const [currentQ, setCurrentQ] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [history, setHistory] = useState([]);
  const [startTime] = useState(Date.now());

  const q = questions[currentQ];
  const percentage = answered > 0 ? Math.round((score / answered) * 100) : 0;

  const handleAnswer = (idx) => {
    if (showResult) return;
    setSelectedAnswer(idx);
    setShowResult(true);
    const isCorrect = idx === q.correct;
    if (isCorrect) setScore(s => s + 1);
    setAnswered(a => a + 1);
    setHistory(h => [...h, { question: q, answer: idx, correct: isCorrect }]);
  };

  const nextQuestion = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    } else {
      const elapsed = Math.round((Date.now() - startTime) / 1000);
      onFinish({ score, total: questions.length, history, elapsed });
    }
  };

  const letters = 'ABCDE';

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top Bar */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(139,92,246,0.08)',
      }}>
        <button onClick={onExit} style={{
          background: 'none', border: 'none', color: 'rgba(200,180,255,0.5)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        }}>
          <Icons.Back /> Salir
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(200,180,255,0.4)', fontFamily: "'Space Mono', monospace" }}>
            {score}/{answered}
          </span>
          <div style={{
            padding: '4px 10px', borderRadius: 8,
            background: percentage >= 70 ? 'rgba(34,197,94,0.15)' : percentage >= 50 ? 'rgba(250,204,21,0.15)' : 'rgba(239,68,68,0.15)',
            color: percentage >= 70 ? '#4ade80' : percentage >= 50 ? '#fbbf24' : '#f87171',
            fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono', monospace",
          }}>
            {percentage}%
          </div>
        </div>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.03)' }}>
        <div style={{
          height: '100%', width: `${((currentQ + 1) / questions.length) * 100}%`,
          background: 'linear-gradient(90deg, #7c3aed, #6366f1)', transition: 'width 0.5s ease',
        }} />
      </div>

      <div style={{ padding: '24px 20px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          <div style={{
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.15)',
            fontSize: 11, color: '#a78bfa', fontWeight: 600, fontFamily: "'Space Mono', monospace",
          }}>
            {currentQ + 1}/{questions.length}
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)',
            fontSize: 11, color: '#93c5fd', fontWeight: 500,
          }}>
            {THEME_EMOJIS[q.theme] || '📋'} {q.theme}
          </div>
          <div style={{
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            fontSize: 11, color: 'rgba(200,180,255,0.4)',
          }}>
            {q.year} {q.simulacro}
          </div>
        </div>

        <h2 style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.6, color: '#f0e8ff', marginBottom: 24 }}>
          {q.question}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {q.options.map((opt, i) => {
            const isSelected = selectedAnswer === i;
            const isCorrectOpt = i === q.correct;
            let bg = 'rgba(255,255,255,0.03)';
            let border = 'rgba(255,255,255,0.06)';
            let textColor = '#d0c8e0';

            if (showResult) {
              if (isCorrectOpt) { bg = 'rgba(34,197,94,0.1)'; border = 'rgba(34,197,94,0.4)'; textColor = '#4ade80'; }
              else if (isSelected) { bg = 'rgba(239,68,68,0.1)'; border = 'rgba(239,68,68,0.4)'; textColor = '#f87171'; }
            }

            return (
              <button key={i} onClick={() => handleAnswer(i)} disabled={showResult} style={{
                padding: '14px 16px', borderRadius: 12, border: `1px solid ${border}`,
                background: bg, color: textColor, textAlign: 'left',
                cursor: showResult ? 'default' : 'pointer', fontSize: 14, lineHeight: 1.5,
                display: 'flex', alignItems: 'flex-start', gap: 12, transition: 'all 0.2s',
              }}>
                <span style={{
                  minWidth: 28, height: 28, borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: showResult && isCorrectOpt ? 'rgba(34,197,94,0.2)' : showResult && isSelected ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                  fontSize: 12, fontWeight: 700, fontFamily: "'Space Mono', monospace", flexShrink: 0,
                }}>
                  {showResult && isCorrectOpt ? <Icons.Check /> : showResult && isSelected ? <Icons.X /> : letters[i]}
                </span>
                <span style={{ paddingTop: 3 }}>{opt}</span>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div style={{ marginTop: 20 }} className="fade-in">
            <button onClick={() => setShowExplanation(!showExplanation)} style={{
              width: '100%', padding: '12px 16px', borderRadius: 12,
              border: '1px solid rgba(139,92,246,0.15)', background: 'rgba(139,92,246,0.06)',
              color: '#c4b5fd', fontSize: 13, cursor: 'pointer', fontWeight: 600,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Icons.Book /> {showExplanation ? 'Ocultar explicacion' : 'Ver explicacion'}
            </button>

            {showExplanation && q.explanation && (
              <div style={{
                marginTop: 12, padding: '16px 18px', borderRadius: 12,
                background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)',
                fontSize: 14, lineHeight: 1.7, color: 'rgba(200,180,255,0.8)',
              }}>
                {q.explanation}
              </div>
            )}

            <AITutor question={q} userAnswer={selectedAnswer} isCorrect={selectedAnswer === q.correct} />

            <button onClick={nextQuestion} style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', marginTop: 16,
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 16px rgba(124,58,237,0.25)',
            }}>
              {currentQ < questions.length - 1 ? <>Siguiente <Icons.Arrow /></> : <>Ver Resultados <Icons.Chart /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Results ───
function ResultsScreen({ results, allHistory, onRestart, onHome, onAnalysis }) {
  const { score, total, history, elapsed } = results;
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 90 ? 'Excelente' : pct >= 70 ? 'Aprobado' : pct >= 50 ? 'Regular' : 'Necesita repaso';
  const gradeColor = pct >= 90 ? '#4ade80' : pct >= 70 ? '#34d399' : pct >= 50 ? '#fbbf24' : '#f87171';

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  const byTheme = {};
  history.forEach(h => {
    const t = h.question.theme;
    if (!byTheme[t]) byTheme[t] = { correct: 0, total: 0 };
    byTheme[t].total++;
    if (h.correct) byTheme[t].correct++;
  });

  // Sort by worst performing
  const sortedThemes = Object.entries(byTheme).sort((a, b) => {
    const pctA = a[1].correct / a[1].total;
    const pctB = b[1].correct / b[1].total;
    return pctA - pctB;
  });

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{
        padding: '48px 24px', textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(139,92,246,0.12) 0%, transparent 60%)',
      }}>
        <div style={{
          width: 120, height: 120, borderRadius: '50%', margin: '0 auto 24px',
          background: `conic-gradient(${gradeColor} ${pct * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%', background: '#08061a',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontSize: 32, fontWeight: 700, color: gradeColor, fontFamily: "'Space Mono', monospace" }}>{pct}%</span>
          </div>
        </div>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: gradeColor, marginBottom: 6 }}>{grade}</h2>
        <p style={{ fontSize: 15, color: 'rgba(200,180,255,0.5)' }}>
          {score} de {total} correctas &middot; {minutes}:{seconds.toString().padStart(2, '0')}
        </p>
      </div>

      <div style={{ padding: '0 24px 24px', maxWidth: 640, margin: '0 auto' }}>
        {/* Performance by theme */}
        <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,180,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Rendimiento por tema
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
          {sortedThemes.map(([theme, data]) => {
            const tPct = Math.round((data.correct / data.total) * 100);
            return (
              <div key={theme} style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <span style={{ fontSize: 14, color: '#d0c8e0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {THEME_EMOJIS[theme] || '📋'} {theme}
                  <span style={{ fontSize: 11, opacity: 0.5 }}>({data.correct}/{data.total})</span>
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 80, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${tPct}%`, background: tPct >= 70 ? '#4ade80' : tPct >= 50 ? '#fbbf24' : '#f87171', transition: 'width 0.5s' }} />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: tPct >= 70 ? '#4ade80' : tPct >= 50 ? '#fbbf24' : '#f87171', minWidth: 40, textAlign: 'right' }}>
                    {tPct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Incorrect questions */}
        {history.some(h => !h.correct) && (
          <>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: 'rgba(200,180,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
              Preguntas incorrectas ({history.filter(h => !h.correct).length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 28 }}>
              {history.filter(h => !h.correct).map((h, i) => (
                <div key={i} style={{
                  padding: '14px 16px', borderRadius: 12,
                  background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)',
                }}>
                  <div style={{
                    fontSize: 11, color: 'rgba(200,180,255,0.4)', marginBottom: 6,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {THEME_EMOJIS[h.question.theme] || '📋'} {h.question.theme}
                  </div>
                  <p style={{ fontSize: 13, color: '#f0e8ff', lineHeight: 1.5, marginBottom: 8 }}>
                    {h.question.question}
                  </p>
                  <div style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span style={{ color: '#f87171' }}>Tu respuesta: {h.question.options[h.answer]}</span>
                    <span style={{ color: '#4ade80' }}>Correcta: {h.question.options[h.question.correct]}</span>
                  </div>
                  {h.question.explanation && (
                    <p style={{ fontSize: 12, color: 'rgba(200,180,255,0.5)', marginTop: 8, lineHeight: 1.5, fontStyle: 'italic' }}>
                      {h.question.explanation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* AI Analysis Button */}
        <button onClick={onAnalysis} style={{
          width: '100%', padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer', marginBottom: 12,
          background: 'linear-gradient(135deg, #f59e0b, #d97706)',
          color: '#fff', fontSize: 14, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: '0 4px 16px rgba(245,158,11,0.25)',
        }}>
          <Icons.Brain /> Analisis IA de mis debilidades y recomendaciones
        </button>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onRestart} style={{
            flex: 1, padding: '16px', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
            color: '#fff', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Icons.Refresh /> Repetir
          </button>
          <button onClick={onHome} style={{
            flex: 1, padding: '16px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
            color: 'rgba(200,180,255,0.6)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Icons.Back /> Inicio
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Study ───
function StudyScreen({ onBack }) {
  const [studyIdx, setStudyIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyFilter, setStudyFilter] = useState('all');

  const filtered = studyFilter === 'all' ? QUESTION_BANK : QUESTION_BANK.filter(q => q.theme === studyFilter);
  const card = filtered[studyIdx % filtered.length];

  return (
    <div style={{ minHeight: '100vh' }}>
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(139,92,246,0.08)',
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: 'none', color: 'rgba(200,180,255,0.5)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13,
        }}>
          <Icons.Back /> Volver
        </button>
        <span style={{ fontSize: 13, color: 'rgba(200,180,255,0.4)', fontFamily: "'Space Mono', monospace" }}>
          {(studyIdx % filtered.length) + 1}/{filtered.length}
        </span>
      </div>

      <div style={{ padding: '16px 20px', maxWidth: 680, margin: '0 auto' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', ...THEMES].map(s => (
            <button key={s} onClick={() => { setStudyFilter(s); setStudyIdx(0); setShowAnswer(false); }} style={{
              padding: '6px 12px', borderRadius: 8, fontSize: 12,
              border: `1px solid ${studyFilter === s ? 'rgba(139,92,246,0.4)' : 'rgba(255,255,255,0.06)'}`,
              background: studyFilter === s ? 'rgba(139,92,246,0.12)' : 'transparent',
              color: studyFilter === s ? '#c4b5fd' : 'rgba(200,180,255,0.4)',
              cursor: 'pointer',
            }}>
              {s === 'all' ? 'Todas' : `${THEME_EMOJIS[s] || ''} ${s}`}
            </button>
          ))}
        </div>

        {card && (
          <>
            <div onClick={() => setShowAnswer(!showAnswer)} style={{
              padding: 28, borderRadius: 16, cursor: 'pointer', minHeight: 200, transition: 'all 0.3s',
              background: showAnswer ? 'linear-gradient(135deg, rgba(34,197,94,0.06), rgba(59,130,246,0.04))' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${showAnswer ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)'}`,
            }}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <div style={{
                  padding: '4px 10px', borderRadius: 6, display: 'inline-block',
                  background: 'rgba(139,92,246,0.1)',
                  fontSize: 11, color: '#a78bfa', fontWeight: 600,
                }}>
                  {THEME_EMOJIS[card.theme] || '📋'} {card.theme}
                </div>
                <div style={{
                  padding: '4px 10px', borderRadius: 6,
                  background: 'rgba(255,255,255,0.04)',
                  fontSize: 11, color: 'rgba(200,180,255,0.4)',
                }}>
                  {card.year}
                </div>
              </div>
              <p style={{ fontSize: 16, lineHeight: 1.6, color: '#f0e8ff', marginBottom: showAnswer ? 20 : 0 }}>
                {card.question}
              </p>
              {showAnswer ? (
                <>
                  {card.options.map((opt, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                      background: i === card.correct ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${i === card.correct ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)'}`,
                    }}>
                      <span style={{ fontSize: 14, color: i === card.correct ? '#4ade80' : 'rgba(200,180,255,0.5)', fontWeight: i === card.correct ? 600 : 400 }}>
                        {'ABCDE'[i]}) {opt}
                      </span>
                    </div>
                  ))}
                  {card.explanation && (
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(200,180,255,0.7)', marginTop: 12 }}>{card.explanation}</p>
                  )}
                </>
              ) : (
                <>
                  {card.options.map((opt, i) => (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 10, marginBottom: 6,
                      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <span style={{ fontSize: 14, color: 'rgba(200,180,255,0.5)' }}>{'ABCDE'[i]}) {opt}</span>
                    </div>
                  ))}
                  <p style={{ fontSize: 12, color: 'rgba(200,180,255,0.3)', marginTop: 16, textAlign: 'center' }}>
                    Toca para ver la respuesta
                  </p>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => { setStudyIdx(Math.max(0, studyIdx - 1)); setShowAnswer(false); }} style={{
                flex: 1, padding: '14px', borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)',
                color: 'rgba(200,180,255,0.5)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                <Icons.Back /> Anterior
              </button>
              <button onClick={() => { setStudyIdx(studyIdx + 1); setShowAnswer(false); }} style={{
                flex: 1, padding: '14px', borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}>
                Siguiente <Icons.Arrow />
              </button>
            </div>

            {showAnswer && <AITutor question={card} userAnswer={null} isCorrect={false} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ───
function getWeakAreas(allHistory) {
  if (allHistory.length === 0) return [];
  const byTheme = {};
  allHistory.forEach(sim => {
    sim.history.forEach(h => {
      const t = h.question.theme;
      if (!byTheme[t]) byTheme[t] = { correct: 0, total: 0 };
      byTheme[t].total++;
      if (h.correct) byTheme[t].correct++;
    });
  });
  return Object.entries(byTheme)
    .map(([theme, data]) => ({
      theme,
      pct: Math.round((data.correct / data.total) * 100),
      total: data.total,
      correct: data.correct,
    }))
    .filter(a => a.pct < 70 && a.total >= 2)
    .sort((a, b) => a.pct - b.pct);
}

// ─── Main App ───
export default function App() {
  const [session, setSession] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fucs_session'));
    } catch { return null; }
  });
  const [screen, setScreen] = useState('home');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [results, setResults] = useState(null);
  const [lastConfig, setLastConfig] = useState({ themes: [], size: 20 });
  const [allHistory, setAllHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fucs_history') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fucs_history', JSON.stringify(allHistory.slice(-50)));
    } catch {}
  }, [allHistory]);

  const handleLogin = (sess) => {
    setSession(sess);
  };

  const handleLogout = async () => {
    const { supabase } = await import('./lib/supabase');
    await supabase.auth.signOut();
    localStorage.removeItem('fucs_session');
    setSession(null);
    setScreen('home');
  };

  const startQuiz = (themes, size) => {
    let pool = themes.length > 0
      ? QUESTION_BANK.filter(q => themes.includes(q.theme))
      : [...QUESTION_BANK];
    const shuffled = shuffleArray(pool).slice(0, Math.min(size, pool.length));
    setQuizQuestions(shuffled);
    setLastConfig({ themes, size });
    setScreen('quiz');
  };

  const finishQuiz = (res) => {
    setResults(res);
    const newEntry = {
      date: new Date().toISOString(),
      score: res.score,
      total: res.total,
      elapsed: res.elapsed,
      history: res.history,
    };
    setAllHistory(prev => [...prev, newEntry]);
    setScreen('results');
  };

  // Show login if no session
  if (!session) {
    return (
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#08061a', color: '#e8e0f0', minHeight: '100vh' }}>
        <LoginScreen onLogin={handleLogin} />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#08061a', color: '#e8e0f0', minHeight: '100vh' }}>
      {/* Session bar */}
      <div style={{
        padding: '8px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(139,92,246,0.06)', borderBottom: '1px solid rgba(139,92,246,0.1)',
      }}>
        <span style={{ fontSize: 12, color: 'rgba(200,180,255,0.5)' }}>
          {session.name} {session.email && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: 'rgba(200,180,255,0.3)' }}>&middot; {session.email}</span>}
        </span>
        <button onClick={handleLogout} style={{
          background: 'none', border: 'none', color: 'rgba(200,180,255,0.3)',
          cursor: 'pointer', fontSize: 11, padding: '4px 8px',
        }}>
          Cerrar sesion
        </button>
      </div>

      {screen === 'home' && (
        <HomeScreen
          onStartQuiz={startQuiz}
          onStudy={() => setScreen('study')}
          history={allHistory}
        />
      )}
      {screen === 'quiz' && (
        <QuizScreen
          questions={quizQuestions}
          onFinish={finishQuiz}
          onExit={() => setScreen('home')}
        />
      )}
      {screen === 'results' && results && (
        <ResultsScreen
          results={results}
          allHistory={allHistory}
          onRestart={() => startQuiz(lastConfig.themes, lastConfig.size)}
          onHome={() => setScreen('home')}
          onAnalysis={() => setScreen('analysis')}
        />
      )}
      {screen === 'analysis' && results && (
        <AnalysisPanel
          results={results}
          allHistory={allHistory}
          onBack={() => setScreen('results')}
          onHome={() => setScreen('home')}
          onPractice={(themes) => startQuiz(themes, 20)}
        />
      )}
      {screen === 'study' && <StudyScreen onBack={() => setScreen('home')} />}
    </div>
  );
}
