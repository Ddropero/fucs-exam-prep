import { useState, useEffect, useRef } from 'react';
import { Icons } from './Icons';

export function AITutor({ question, userAnswer, isCorrect }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatRef = useRef(null);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const payload = {
        messages: newMessages.map(m => ({ role: m.role, content: m.content })),
        question: {
          text: question.question,
          options: question.options,
          correct: question.correct,
          correctText: question.options[question.correct],
          userAnswer: userAnswer !== null ? question.options[userAnswer] : null,
          userAnswerIndex: userAnswer,
          isCorrect: isCorrect,
          explanation: question.explanation,
          theme: question.theme,
          year: question.year,
        },
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: 'La API no devolvio JSON valido. Status: ' + res.status + '. Verifica que el deploy en Vercel este activo.'
        }]);
        setLoading(false);
        return;
      }

      const reply = data.reply || data.error || 'Sin respuesta.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);

    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'No se pudo conectar con /api/chat. Error: ' + (err.message || 'red no disponible') + '. Si estas en desarrollo local, usa "vercel dev" en vez de "npm run dev".'
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
