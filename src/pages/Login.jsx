import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import { getApiBaseUrl, setApiBaseUrl } from '../api.js';

// 12 spokes/ticks at fixed angles — a Vedic-chart-wheel motif, computed
// once (not animated/interactive), so plain values suffice.
const WHEEL_POINTS = Array.from({ length: 12 }, (_, i) => {
  const angle = (i / 12) * Math.PI * 2;
  return { x: Math.cos(angle) * 400, y: Math.sin(angle) * 400 };
});

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [apiBase, setApiBase] = useState(getApiBaseUrl());
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (apiBase.trim()) setApiBaseUrl(apiBase.trim());

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not sign in.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="login-shell"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        position: 'relative',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse 900px 700px at 50% -10%, #1c2050 0%, var(--bg) 60%)',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: 900,
          height: 900,
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      >
        <svg viewBox="0 0 900 900" style={{ width: '100%', height: '100%', opacity: 0.55 }}>
          <defs>
            <radialGradient id="ringGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(201,162,75,0.35)" />
              <stop offset="100%" stopColor="rgba(141,147,255,0.08)" />
            </radialGradient>
          </defs>
          <g transform="translate(450,450)">
            {[130, 220, 310, 400].map((r) => (
              <circle key={r} r={r} fill="none" stroke="url(#ringGrad)" strokeWidth="1" />
            ))}
            {WHEEL_POINTS.map((p, i) => (
              <line key={i} x1={0} y1={0} x2={p.x} y2={p.y} stroke="rgba(141,147,255,0.12)" strokeWidth="1" />
            ))}
            {WHEEL_POINTS.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="rgba(201,162,75,0.5)" />
            ))}
          </g>
        </svg>
      </div>

      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div
            style={{
              width: 52,
              height: 52,
              margin: '0 auto 14px',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 32% 28%, var(--brass-bright), var(--brass) 60%, #8a6c2c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              color: '#1A1400',
              fontSize: 24,
              boxShadow: '0 0 0 1px rgba(201,162,75,0.25), 0 8px 24px rgba(201,162,75,0.18)',
            }}
          >
            A
          </div>
          <h1 style={{ fontSize: 24, marginBottom: 4 }}>AstroMitra Admin</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sign in to manage Kundli records, AI keys, and prompts</p>
        </div>

        <div className="card" style={{ padding: '28px 28px 24px' }}>
          {error && (
            <div
              style={{
                background: 'var(--danger-bg)',
                border: '1px solid rgba(232,103,122,0.35)',
                color: 'var(--danger)',
                fontSize: 12.5,
                padding: '10px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16,
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                autoComplete="username"
                required
                placeholder="admin@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                autoComplete="current-password"
                required
                placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? <span className="spinner" /> : 'Sign in'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 18 }}>
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 12, cursor: 'pointer' }}
            >
              Backend connection settings
            </button>
          </div>

          {showAdvanced && (
            <div style={{ marginTop: 12 }}>
              <div className="field" style={{ marginTop: 4 }}>
                <label htmlFor="api-base">API base URL</label>
                <input type="text" id="api-base" placeholder="https://astromitra-kundliapi.onrender.com" value={apiBase} onChange={(e) => setApiBase(e.target.value)} />
                <p className="hint">Where this admin panel sends requests. Change this if your backend runs somewhere other than localhost.</p>
              </div>
            </div>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 11.5, color: 'var(--text-muted)' }}>
          No account here is created or invited — this connects to the single admin account configured on the backend.
        </p>
      </div>
    </div>
  );
}
