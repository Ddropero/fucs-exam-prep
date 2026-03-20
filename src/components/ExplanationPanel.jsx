import { useState } from 'react';
import { Icons } from './Icons';

function parseExplanation(text, options, correctIdx) {
  if (!text) return null;

  const letters = ['A', 'B', 'C', 'D', 'E'];
  const sections = {
    correct: '',
    distractors: [],
    keyConcept: '',
    studyTip: '',
  };

  // Extract correct answer section
  const correctMatch = text.match(/✅\s*RESPUESTA CORRECTA\s*\([A-E]\):\s*(.*?)(?=\s*❌|🔑|📚|$)/s);
  if (correctMatch) {
    sections.correct = correctMatch[1].trim();
  }

  // Extract distractors
  const distractorRegex = /❌\s*([A-E]):\s*(.*?)(?=\s*❌|🔑|📚|$)/gs;
  let match;
  while ((match = distractorRegex.exec(text)) !== null) {
    sections.distractors.push({
      letter: match[1],
      text: match[2].trim(),
    });
  }

  // Extract key concept
  const keyMatch = text.match(/🔑\s*CONCEPTO CLAVE:\s*(.*?)(?=\s*📚|$)/s);
  if (keyMatch) {
    sections.keyConcept = keyMatch[1].trim();
  }

  // Extract study tip
  const tipMatch = text.match(/📚\s*CONSEJO:\s*(.*?)$/s);
  if (tipMatch) {
    sections.studyTip = tipMatch[1].trim();
  }

  return sections;
}

export function ExplanationPanel({ question }) {
  const [expandedSection, setExpandedSection] = useState('correct');
  const letters = ['A', 'B', 'C', 'D', 'E'];
  const parsed = parseExplanation(question.explanation, question.options, question.correct);

  if (!parsed) {
    return (
      <div style={{
        padding: '16px 18px', borderRadius: 12,
        background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)',
        fontSize: 14, lineHeight: 1.7, color: 'rgba(200,180,255,0.8)',
      }}>
        {question.explanation}
      </div>
    );
  }

  const toggleSection = (s) => setExpandedSection(expandedSection === s ? null : s);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Correct Answer */}
      {parsed.correct && (
        <div style={{
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(34,197,94,0.2)',
          background: 'rgba(34,197,94,0.04)',
        }}>
          <button onClick={() => toggleSection('correct')} style={{
            width: '100%', padding: '14px 16px', border: 'none', cursor: 'pointer',
            background: expandedSection === 'correct' ? 'rgba(34,197,94,0.08)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: '#4ade80', fontSize: 13, fontWeight: 700, textAlign: 'left',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(34,197,94,0.15)', fontSize: 12, fontWeight: 800,
                fontFamily: "'Space Mono', monospace",
              }}>
                {letters[question.correct]}
              </span>
              ✅ Respuesta Correcta
            </span>
            <span style={{ fontSize: 16, transition: 'transform 0.2s', transform: expandedSection === 'correct' ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
          </button>
          {expandedSection === 'correct' && (
            <div style={{
              padding: '0 16px 16px', fontSize: 14, lineHeight: 1.8,
              color: 'rgba(200,230,200,0.85)', animation: 'fadeIn 0.3s ease',
            }}>
              {parsed.correct}
            </div>
          )}
        </div>
      )}

      {/* Distractors */}
      {parsed.distractors.map((d, i) => (
        <div key={d.letter} style={{
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(239,68,68,0.12)',
          background: 'rgba(239,68,68,0.02)',
        }}>
          <button onClick={() => toggleSection(`distractor-${i}`)} style={{
            width: '100%', padding: '14px 16px', border: 'none', cursor: 'pointer',
            background: expandedSection === `distractor-${i}` ? 'rgba(239,68,68,0.06)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: '#f87171', fontSize: 13, fontWeight: 600, textAlign: 'left',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 26, height: 26, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(239,68,68,0.12)', fontSize: 12, fontWeight: 800,
                fontFamily: "'Space Mono', monospace", color: '#fca5a5',
              }}>
                {d.letter}
              </span>
              <span style={{ color: 'rgba(252,165,165,0.8)' }}>
                ❌ Por qué {d.letter} es incorrecta
              </span>
            </span>
            <span style={{ fontSize: 16, transition: 'transform 0.2s', transform: expandedSection === `distractor-${i}` ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
          </button>
          {expandedSection === `distractor-${i}` && (
            <div style={{
              padding: '0 16px 16px', fontSize: 14, lineHeight: 1.8,
              color: 'rgba(255,200,200,0.75)', animation: 'fadeIn 0.3s ease',
            }}>
              {d.text}
            </div>
          )}
        </div>
      ))}

      {/* Key Concept */}
      {parsed.keyConcept && (
        <div style={{
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(250,204,21,0.15)',
          background: 'rgba(250,204,21,0.03)',
        }}>
          <button onClick={() => toggleSection('concept')} style={{
            width: '100%', padding: '14px 16px', border: 'none', cursor: 'pointer',
            background: expandedSection === 'concept' ? 'rgba(250,204,21,0.06)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: '#fbbf24', fontSize: 13, fontWeight: 700, textAlign: 'left',
          }}>
            <span>🔑 Concepto Clave</span>
            <span style={{ fontSize: 16, transition: 'transform 0.2s', transform: expandedSection === 'concept' ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
          </button>
          {expandedSection === 'concept' && (
            <div style={{
              padding: '0 16px 16px', fontSize: 14, lineHeight: 1.8,
              color: 'rgba(251,191,36,0.85)', animation: 'fadeIn 0.3s ease',
            }}>
              {parsed.keyConcept}
            </div>
          )}
        </div>
      )}

      {/* Study Tip */}
      {parsed.studyTip && (
        <div style={{
          borderRadius: 14, overflow: 'hidden',
          border: '1px solid rgba(59,130,246,0.15)',
          background: 'rgba(59,130,246,0.03)',
        }}>
          <button onClick={() => toggleSection('tip')} style={{
            width: '100%', padding: '14px 16px', border: 'none', cursor: 'pointer',
            background: expandedSection === 'tip' ? 'rgba(59,130,246,0.06)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            color: '#60a5fa', fontSize: 13, fontWeight: 700, textAlign: 'left',
          }}>
            <span>📚 Consejo de Estudio</span>
            <span style={{ fontSize: 16, transition: 'transform 0.2s', transform: expandedSection === 'tip' ? 'rotate(180deg)' : 'rotate(0)' }}>▾</span>
          </button>
          {expandedSection === 'tip' && (
            <div style={{
              padding: '0 16px 16px', fontSize: 14, lineHeight: 1.8,
              color: 'rgba(147,197,253,0.85)', animation: 'fadeIn 0.3s ease',
            }}>
              {parsed.studyTip}
            </div>
          )}
        </div>
      )}

      {/* Difficulty badge */}
      {question.difficulty && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
          <span style={{
            padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em',
            background: question.difficulty === 'alta' ? 'rgba(239,68,68,0.1)' : question.difficulty === 'media' ? 'rgba(250,204,21,0.1)' : 'rgba(34,197,94,0.1)',
            color: question.difficulty === 'alta' ? '#f87171' : question.difficulty === 'media' ? '#fbbf24' : '#4ade80',
            border: `1px solid ${question.difficulty === 'alta' ? 'rgba(239,68,68,0.2)' : question.difficulty === 'media' ? 'rgba(250,204,21,0.2)' : 'rgba(34,197,94,0.2)'}`,
          }}>
            Dificultad: {question.difficulty}
          </span>
        </div>
      )}
    </div>
  );
}
