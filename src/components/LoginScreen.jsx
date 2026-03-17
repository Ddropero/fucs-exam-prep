import { useState } from 'react';
import { Icons } from './Icons';
import { supabase } from '../lib/supabase';
import { getDeviceFingerprint } from '../lib/deviceFingerprint';

export function LoginScreen({ onLogin }) {
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!accessCode.trim()) {
      setError('Ingresa tu codigo de acceso');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fingerprint = await getDeviceFingerprint();

      // Look up the access code
      const { data: user, error: fetchErr } = await supabase
        .from('fucs_users')
        .select('*')
        .eq('access_code', accessCode.trim().toUpperCase())
        .single();

      if (fetchErr || !user) {
        setError('Codigo de acceso invalido. Contacta al administrador.');
        setLoading(false);
        return;
      }

      // Check if account is active
      if (!user.is_active) {
        setError('Tu cuenta ha sido desactivada. Contacta al administrador.');
        setLoading(false);
        return;
      }

      // Check device fingerprint
      if (user.device_fingerprint && user.device_fingerprint !== fingerprint) {
        setError('Este codigo ya esta asociado a otro dispositivo. Contacta al administrador para desbloquearlo.');
        setLoading(false);
        return;
      }

      // First login on this device - save fingerprint and name
      if (!user.device_fingerprint) {
        const updateData = {
          device_fingerprint: fingerprint,
          last_login: new Date().toISOString(),
        };
        if (name.trim()) updateData.student_name = name.trim();

        await supabase
          .from('fucs_users')
          .update(updateData)
          .eq('id', user.id);
      } else {
        // Update last login
        await supabase
          .from('fucs_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', user.id);
      }

      // Save session locally
      const session = {
        userId: user.id,
        name: name.trim() || user.student_name || 'Estudiante',
        code: accessCode.trim().toUpperCase(),
        fingerprint,
      };
      localStorage.setItem('fucs_session', JSON.stringify(session));

      onLogin(session);

    } catch (err) {
      setError('Error de conexion: ' + (err.message || 'Verifica tu internet'));
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      background: 'radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.12) 0%, transparent 60%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
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
            fontSize: 'clamp(32px, 6vw, 48px)', fontWeight: 700,
            background: 'linear-gradient(135deg, #fff 0%, #c4b5fd 50%, #818cf8 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1.1, margin: '0 0 12px',
            fontFamily: "'Space Mono', monospace",
          }}>
            FUCS<br />EXAM PREP
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(200,180,255,0.5)', lineHeight: 1.6 }}>
            Ingresa tu codigo de acceso para comenzar
          </p>
        </div>

        {/* Form */}
        <div style={{
          padding: 28,
          borderRadius: 18,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(139,92,246,0.12)',
          backdropFilter: 'blur(10px)',
        }}>
          <div style={{ marginBottom: 18 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'rgba(200,180,255,0.5)', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Tu nombre
            </label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Nombre completo (opcional)"
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: '1px solid rgba(139,92,246,0.15)',
                background: 'rgba(255,255,255,0.04)',
                color: '#e8e0f0', fontSize: 15, outline: 'none',
                fontFamily: "'DM Sans', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'rgba(200,180,255,0.5)', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Codigo de acceso
            </label>
            <input
              value={accessCode}
              onChange={e => setAccessCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              placeholder="Ej: FUCS-ABC123"
              maxLength={20}
              style={{
                width: '100%', padding: '14px 16px', borderRadius: 12,
                border: '1px solid rgba(139,92,246,0.25)',
                background: 'rgba(139,92,246,0.06)',
                color: '#c4b5fd', fontSize: 18, outline: 'none',
                fontFamily: "'Space Mono', monospace",
                fontWeight: 700, letterSpacing: '0.1em',
                textAlign: 'center',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 18,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              fontSize: 13, color: '#fca5a5', lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !accessCode.trim()}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              background: accessCode.trim()
                ? 'linear-gradient(135deg, #7c3aed, #6366f1, #4f46e5)'
                : 'rgba(255,255,255,0.05)',
              color: accessCode.trim() ? '#fff' : 'rgba(255,255,255,0.3)',
              fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: accessCode.trim() ? '0 4px 20px rgba(124,58,237,0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <><Icons.Loading /> Verificando...</>
            ) : (
              <><Icons.Target /> Ingresar</>
            )}
          </button>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', fontSize: 11, color: 'rgba(200,180,255,0.25)',
          marginTop: 24, lineHeight: 1.6,
        }}>
          Tu codigo se vinculara a este dispositivo.<br />
          Solo podras usarlo desde aqui.
        </p>
      </div>
    </div>
  );
}
