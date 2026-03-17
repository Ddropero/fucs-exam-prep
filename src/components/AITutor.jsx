import { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

const WORKER_URL = 'https://bid-proxy.ddropero.workers.dev';

export function AITutor({ question, userAnswer, isCorrect }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const buildSystemPrompt = () => {
    let opts = '';
    for (let i = 0; i < question.options.length; i++) {
      if (i > 0) opts += ', ';
      opts += String.fromCharCode(65 + i) + ') ' + question.options[i];
    }
    const correctLetter = String.fromCharCode(65 + question.correct);
    const correctText = question.options[question.correct];
    const studentAns = userAnswer !== null
      ? String.fromCharCode(65 + userAnswer) + ') ' + question.options[userAnswer]
      : 'No ha respondido aun';

    return `Eres un tutor medico experto de la FUCS (Fundacion Universitaria de Ciencias de la Salud, Colombia). Ayudas estudiantes a prepararse para el examen medico.

PREGUNTA: ${question.question}
OPCIONES: ${opts}
CORRECTA: ${correctLetter}) ${correctText}
ESTUDIANTE: ${studentAns}
${isCorrect ? 'ACERTO' : 'FALLO'}
EXPLICACION: ${question.explanation || 'No disponible'}
TEMA: ${question.theme || 'General'}
AÑO: ${question.year || 'N/A'}

INSTRUCCIONES:
- Responde en espanol, max 200 palabras
- Usa **negritas** para terminos clave
- Si el estudiante fallo, explica POR QUE su respuesta fue incorrecta y el razonamiento correcto
- Relaciona con conceptos clinicos relevantes
- Si preguntan sobre un tema diferente, responde con tu conocimiento medico`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: buildSystemPrompt(),
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'La API no devolvio JSON valido. Status: ' + res.status
        }]);
        setLoading(false);
        return;
      }

      if (data.error) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'Error de API: ' + (data.error.message || JSON.stringify(data.error))
        }]);
        setLoading(false);
        return;
      }

      let reply = '';
      if (data.content && Array.isArray(data.content)) {
        for (let j = 0; j < data.content.length; j++) {
          if (data.content[j].text) reply += data.content[j].text;
        }
      }
      setMessages(prev => [...prev, { role: 'assistant', content: reply || 'Sin respuesta.' }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'No se pudo conectar con el tutor IA. Error: ' + (err.message || 'red no disponible')
      }]);
    }
    setLoading(false);
  };

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages, loading]);

  const formatMsg = (text) => {
    return text.split('**').map((part, i) =>
      i % 2 === 1 ? <strong key={i} style={{ color: '#c8a2ff' }}>{part}</strong> : part
    );
  };

  return (
    <div style={{
      background: 'rgba(15,10,30,0.7)',
      border: '1px solid rgba(139,92,246,0.2)',
      borderRadius: 16,
      overflow: 'hidden',
      marginTop: 16,
    }}>
      <div style={{
        padding: '12px 16px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(59,130,246,0.1))',
        borderBottom: '1px solid rgba(139,92,246,0.15)',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Icons.Brain />
        <span style={{ fontWeight: 600, fontSize: 14, color: '#e2d5ff' }}>
          Tutor IA &mdash; Preguntame sobre este tema
        </span>
      </div>

      <div ref={chatRef} style={{
        padding: 16, maxHeight: 280, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        {messages.length === 0 && (
          <div style={{
            color: 'rgba(200,180,255,0.5)', fontSize: 13,
            textAlign: 'center', padding: 20, fontStyle: 'italic',
          }}>
            Preguntame cualquier duda sobre esta pregunta, el tema o conceptos relacionados...
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{
            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%', padding: '10px 14px',
            borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
            background: m.role === 'user'
              ? 'linear-gradient(135deg, #7c3aed, #6366f1)'
              : 'rgba(255,255,255,0.06)',
            color: '#e8e0f0', fontSize: 13, lineHeight: 1.55,
          }}>
            {m.role === 'assistant' ? formatMsg(m.content) : m.content}
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(200,180,255,0.6)', fontSize: 13 }}>
            <Icons.Loading /> Pensando...
          </div>
        )}
      </div>

      <div style={{
        display: 'flex', gap: 8, padding: '12px 16px',
        borderTop: '1px solid rgba(139,92,246,0.1)',
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && sendMessage()}
          placeholder="Escribe tu pregunta..."
          style={{
            flex: 1, padding: '10px 14px', borderRadius: 10,
            border: '1px solid rgba(139,92,246,0.2)',
            background: 'rgba(255,255,255,0.04)',
            color: '#e8e0f0', fontSize: 13, outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 16px', borderRadius: 10, border: 'none',
            background: input.trim() ? 'linear-gradient(135deg, #7c3aed, #6366f1)' : 'rgba(255,255,255,0.05)',
            color: input.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
            cursor: input.trim() ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 13, transition: 'all 0.2s',
          }}
        >
          <Icons.Send />
        </button>
      </div>
    </div>
  );
}
