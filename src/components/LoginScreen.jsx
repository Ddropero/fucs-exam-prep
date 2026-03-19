import { useState } from 'react';
import { Icons } from './Icons';
import { supabase } from '../lib/supabase';
import { getDeviceFingerprint } from '../lib/deviceFingerprint';

export function LoginScreen({ onLogin }) {
  const [accessCode, setAccessCode] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deviceBlocked, setDeviceBlocked] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);

  const handleLogin = async () => {
    if (!accessCode.trim()) {
      setError('Ingresa tu codigo de acceso');
      return;
    }

    setLoading(true);
    setError(null);
    setDeviceBlocked(false);

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
        // Check if there's already a pending request
        const { data: existingReq } = await supabase
          .from('fucs_device_requests')
          .select('*')
          .eq('access_code', accessCode.trim().toUpperCase())
          .eq('new_fingerprint', fingerprint)
          .order('created_at', { ascending: false })
          .limit(1);

        if (existingReq && existingReq.length > 0) {
          const req = existingReq[0];
          if (req.status === 'approved') {
            // Request was approved - update fingerprint and login
            await supabase
              .from('fucs_users')
              .update({
                device_fingerprint: fingerprint,
                last_login: new Date().toISOString(),
              })
              .eq('id', user.id);

            const session = {
              userId: user.id,
              name: name.trim() || user.student_name || 'Estudiante',
              code: accessCode.trim().toUpperCase(),
              fingerprint,
            };
            localStorage.setItem('fucs_session', JSON.stringify(session));
            onLogin(session);
            setLoading(false);
            return;
          } else if (req.status === 'pending') {
            setPendingRequest(true);
            setDeviceBlocked(true);
            setLoading(false);
            return;
          }
          // If denied, allow re-requesting
        }

        setDeviceBlocked(true);
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

  const handleRequestDevice = async () => {
    setLoading(true);
    try {
      const fingerprint = await getDeviceFingerprint();

      const { data: user } = await supabase
        .from('fucs_users')
        .select('id, device_fingerprint')
        .eq('access_code', accessCode.trim().toUpperCase())
        .single();

      if (!user) return;

      // Get device info for admin
      const deviceInfo = [
        navigator.platform,
        `${screen.width}x${screen.height}`,
        navigator.language,
        new Date().toLocaleString('es-CO'),
      ].join(' | ');

      await supabase.from('fucs_device_requests').insert({
        user_id: user.id,
        access_code: accessCode.trim().toUpperCase(),
        new_fingerprint: fingerprint,
        old_fingerprint: user.device_fingerprint,
        device_info: deviceInfo,
      });

      setRequestSent(true);
      setPendingRequest(true);
    } catch (err) {
      setError('Error al enviar solicitud: ' + err.message);
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
          {/* Device blocked state */}
          {deviceBlocked ? (
            <div>
              <div style={{
                padding: '16px', borderRadius: 12, marginBottom: 18,
                background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.25)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
                <p style={{ fontSize: 14, color: '#fbbf24', fontWeight: 600, margin: '0 0 6px' }}>
                  Dispositivo diferente detectado
                </p>
                <p style={{ fontSize: 12, color: 'rgba(251,191,36,0.7)', margin: 0, lineHeight: 1.5 }}>
                  Este codigo esta vinculado a otro dispositivo.
                  {pendingRequest
                    ? ' Tu solicitud esta pendiente de aprobacion.'
                    : ' Puedes solicitar autorizacion para usar este dispositivo.'}
                </p>
              </div>

              {requestSent ? (
                <div style={{
                  padding: '14px', borderRadius: 12,
                  background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, color: '#4ade80', margin: 0, fontWeight: 600 }}>
                    Solicitud enviada
                  </p>
                  <p style={{ fontSize: 12, color: 'rgba(74,222,128,0.7)', margin: '6px 0 0' }}>
                    El administrador revisara tu solicitud. Intenta ingresar mas tarde.
                  </p>
                </div>
              ) : pendingRequest ? (
                <div style={{
                  padding: '14px', borderRadius: 12,
                  background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)',
                  textAlign: 'center',
                }}>
                  <p style={{ fontSize: 13, color: '#a78bfa', margin: 0 }}>
                    Solicitud pendiente. Intenta ingresar mas tarde.
                  </p>
                </div>
              ) : (
                <button
                  onClick={handleRequestDevice}
                  disabled={loading}
                  style={{
                    width: '100%', padding: '14px', borderRadius: 12, border: 'none',
                    cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {loading ? <><Icons.Loading /> Enviando...</> : '📱 Solicitar autorizacion'}
                </button>
              )}

              <button
                onClick={() => { setDeviceBlocked(false); setRequestSent(false); setPendingRequest(false); setError(null); }}
                style={{
                  width: '100%', padding: '12px', borderRadius: 12,
                  border: '1px solid rgba(139,92,246,0.2)', background: 'transparent',
                  color: 'rgba(200,180,255,0.5)', fontSize: 13, cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                Volver
              </button>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', fontSize: 11, color: 'rgba(200,180,255,0.25)',
          marginTop: 24, lineHeight: 1.6,
        }}>
          Tu codigo se vinculara a este dispositivo.<br />
          Para usar otro dispositivo necesitaras autorizacion.
        </p>
      </div>
    </div>
  );
}
