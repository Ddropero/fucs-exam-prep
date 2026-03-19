import { useState } from 'react';
import { Icons } from './Icons';
import { supabase } from '../lib/supabase';
import { getDeviceFingerprint } from '../lib/deviceFingerprint';

export function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authErr) {
        if (authErr.message.includes('Invalid login')) {
          setError('Correo o contraseña incorrectos');
        } else if (authErr.message.includes('Email not confirmed')) {
          setError('Debes confirmar tu correo. Revisa tu bandeja de entrada.');
        } else {
          setError(authErr.message);
        }
        setLoading(false);
        return;
      }

      const user = data.user;
      const fingerprint = await getDeviceFingerprint();

      // Check device lock in fucs_users profile
      const { data: profile } = await supabase
        .from('fucs_users')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (profile) {
        // Check device fingerprint
        if (profile.device_fingerprint && profile.device_fingerprint !== fingerprint) {
          // Check for approved device request
          const { data: approvedReq } = await supabase
            .from('fucs_device_requests')
            .select('*')
            .eq('user_id', profile.id)
            .eq('new_fingerprint', fingerprint)
            .eq('status', 'approved')
            .limit(1);

          if (approvedReq && approvedReq.length > 0) {
            // Approved - update fingerprint
            await supabase
              .from('fucs_users')
              .update({ device_fingerprint: fingerprint, last_login: new Date().toISOString() })
              .eq('id', profile.id);
          } else {
            // Check for pending request
            const { data: pendingReq } = await supabase
              .from('fucs_device_requests')
              .select('*')
              .eq('user_id', profile.id)
              .eq('new_fingerprint', fingerprint)
              .eq('status', 'pending')
              .limit(1);

            if (pendingReq && pendingReq.length > 0) {
              setError('Tu solicitud de cambio de dispositivo esta pendiente. Intenta mas tarde.');
            } else {
              // Create device request
              const deviceInfo = [
                navigator.platform,
                `${screen.width}x${screen.height}`,
                navigator.language,
                new Date().toLocaleString('es-CO'),
              ].join(' | ');

              await supabase.from('fucs_device_requests').insert({
                user_id: profile.id,
                access_code: profile.access_code || user.email,
                new_fingerprint: fingerprint,
                old_fingerprint: profile.device_fingerprint,
                device_info: deviceInfo,
              });

              setError('Este dispositivo es diferente al registrado. Se envio una solicitud de autorizacion al administrador.');
            }

            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }

        // Update last login and fingerprint if first time
        const updateData = { last_login: new Date().toISOString() };
        if (!profile.device_fingerprint) {
          updateData.device_fingerprint = fingerprint;
        }
        await supabase
          .from('fucs_users')
          .update(updateData)
          .eq('id', profile.id);
      } else {
        // First login - create profile
        await supabase.from('fucs_users').insert({
          auth_id: user.id,
          access_code: user.email,
          student_name: user.user_metadata?.full_name || name.trim() || user.email.split('@')[0],
          email: user.email,
          device_fingerprint: fingerprint,
          last_login: new Date().toISOString(),
        });
      }

      // Save session locally
      const session = {
        userId: user.id,
        name: user.user_metadata?.full_name || name.trim() || user.email.split('@')[0],
        email: user.email,
        fingerprint,
      };
      localStorage.setItem('fucs_session', JSON.stringify(session));
      onLogin(session);

    } catch (err) {
      setError('Error de conexion: ' + (err.message || 'Verifica tu internet'));
    }
    setLoading(false);
  };

  const handleRegister = async () => {
    if (!email.trim() || !password || !name.trim()) {
      setError('Completa todos los campos');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signUpErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: { full_name: name.trim() },
        },
      });

      if (signUpErr) {
        if (signUpErr.message.includes('already registered')) {
          setError('Este correo ya esta registrado. Intenta iniciar sesion.');
        } else {
          setError(signUpErr.message);
        }
        setLoading(false);
        return;
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        setSuccess('Cuenta creada. Revisa tu correo para confirmar tu cuenta.');
        setMode('login');
      } else if (data.session) {
        // Auto-login (no email confirmation required)
        const fingerprint = await getDeviceFingerprint();
        await supabase.from('fucs_users').insert({
          auth_id: data.user.id,
          access_code: email.trim(),
          student_name: name.trim(),
          email: email.trim(),
          device_fingerprint: fingerprint,
          last_login: new Date().toISOString(),
        });

        const session = {
          userId: data.user.id,
          name: name.trim(),
          email: email.trim(),
          fingerprint,
        };
        localStorage.setItem('fucs_session', JSON.stringify(session));
        onLogin(session);
      }

    } catch (err) {
      setError('Error: ' + (err.message || 'Verifica tu internet'));
    }
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError('Ingresa tu correo electronico');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resetErr) {
        setError(resetErr.message);
      } else {
        setSuccess('Se envio un enlace de recuperacion a tu correo.');
        setMode('login');
      }
    } catch (err) {
      setError('Error: ' + err.message);
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
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
            {mode === 'login' ? 'Inicia sesion para comenzar' :
             mode === 'register' ? 'Crea tu cuenta para acceder' :
             'Recupera tu contraseña'}
          </p>
        </div>

        {/* Form */}
        <div style={{
          padding: 28, borderRadius: 18,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(139,92,246,0.12)',
          backdropFilter: 'blur(10px)',
        }}>
          {/* Register: Name field */}
          {mode === 'register' && (
            <div style={{ marginBottom: 16 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'rgba(200,180,255,0.5)', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Nombre completo
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
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
          )}

          {/* Email */}
          <div style={{ marginBottom: 16 }}>
            <label style={{
              display: 'block', fontSize: 12, fontWeight: 600,
              color: 'rgba(200,180,255,0.5)', marginBottom: 8,
              textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Correo electronico
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@correo.com"
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

          {/* Password (not for forgot mode) */}
          {mode !== 'forgot' && (
            <div style={{ marginBottom: 24 }}>
              <label style={{
                display: 'block', fontSize: 12, fontWeight: 600,
                color: 'rgba(200,180,255,0.5)', marginBottom: 8,
                textTransform: 'uppercase', letterSpacing: '0.1em',
              }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                placeholder={mode === 'register' ? 'Minimo 6 caracteres' : 'Tu contraseña'}
                style={{
                  width: '100%', padding: '14px 16px', borderRadius: 12,
                  border: '1px solid rgba(139,92,246,0.25)',
                  background: 'rgba(139,92,246,0.06)',
                  color: '#c4b5fd', fontSize: 16, outline: 'none',
                  fontFamily: "'DM Sans', sans-serif",
                  boxSizing: 'border-box',
                }}
              />
            </div>
          )}

          {/* Success message */}
          {success && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 18,
              background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)',
              fontSize: 13, color: '#4ade80', lineHeight: 1.5,
            }}>
              {success}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10, marginBottom: 18,
              background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)',
              fontSize: 13, color: '#fca5a5', lineHeight: 1.5,
            }}>
              {error}
            </div>
          )}

          {/* Main button */}
          <button
            onClick={mode === 'login' ? handleLogin : mode === 'register' ? handleRegister : handleForgotPassword}
            disabled={loading}
            style={{
              width: '100%', padding: '16px', borderRadius: 12, border: 'none',
              cursor: loading ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1, #4f46e5)',
              color: '#fff', fontSize: 15, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: '0 4px 20px rgba(124,58,237,0.3)',
              transition: 'all 0.2s',
            }}
          >
            {loading ? (
              <><Icons.Loading /> {mode === 'login' ? 'Ingresando...' : mode === 'register' ? 'Registrando...' : 'Enviando...'}</>
            ) : (
              mode === 'login' ? <><Icons.Target /> Iniciar Sesion</> :
              mode === 'register' ? <><Icons.Target /> Crear Cuenta</> :
              <><Icons.Target /> Enviar enlace de recuperacion</>
            )}
          </button>

          {/* Forgot password link (login mode) */}
          {mode === 'login' && (
            <button
              onClick={() => { setMode('forgot'); setError(null); setSuccess(null); }}
              style={{
                width: '100%', padding: '10px', marginTop: 12,
                background: 'transparent', border: 'none',
                color: 'rgba(200,180,255,0.4)', fontSize: 12,
                cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Olvide mi contraseña
            </button>
          )}

          {/* Toggle login/register */}
          <div style={{
            marginTop: 16, paddingTop: 16,
            borderTop: '1px solid rgba(139,92,246,0.08)',
            textAlign: 'center',
          }}>
            {mode === 'login' ? (
              <p style={{ fontSize: 13, color: 'rgba(200,180,255,0.4)', margin: 0 }}>
                No tienes cuenta?{' '}
                <button onClick={() => { setMode('register'); setError(null); setSuccess(null); }} style={{
                  background: 'none', border: 'none', color: '#a78bfa',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, textDecoration: 'underline',
                }}>
                  Registrate
                </button>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: 'rgba(200,180,255,0.4)', margin: 0 }}>
                Ya tienes cuenta?{' '}
                <button onClick={() => { setMode('login'); setError(null); setSuccess(null); }} style={{
                  background: 'none', border: 'none', color: '#a78bfa',
                  cursor: 'pointer', fontSize: 13, fontWeight: 600, textDecoration: 'underline',
                }}>
                  Inicia sesion
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <p style={{
          textAlign: 'center', fontSize: 11, color: 'rgba(200,180,255,0.25)',
          marginTop: 24, lineHeight: 1.6,
        }}>
          Tu cuenta se vinculara a este dispositivo.<br />
          Para usar otro dispositivo necesitaras autorizacion.
        </p>
      </div>
    </div>
  );
}
