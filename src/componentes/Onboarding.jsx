import { LexiiusLogo } from './LexiiusLogo';
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const STEPS = ['orgName', 'description', 'confirm'];

export function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [orgName, setOrgName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [inferredDomain, setInferredDomain] = useState('');

  const handleNext = async () => {
    setError('');
    if (step === 0 && !orgName.trim()) { setError('Por favor ingresá el nombre de tu organización.'); return; }
    if (step === 1 && description.trim().length < 20) { setError('Describí tu organización con al menos 20 caracteres.'); return; }

    if (step === 1) {
      // Submit to backend before showing confirm
      setLoading(true);
      try {
        const res = await axios.post(API_URL + '/onboarding/complete', { orgName: orgName.trim(), description: description.trim() });
        setInferredDomain(res.data.inferredDomain || 'general');
        setStep(2);
      } catch (e) {
        setError('Error al guardar el perfil. Intentá de nuevo.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 2) { onComplete(inferredDomain); return; }
    setStep(s => s + 1);
  };

  const domainLabels = { legal: 'Legal / Jurídico', code: 'Desarrollo de Software', data: 'Datos / Analítica', general: 'General' };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(109,40,217,0.18) 0%, transparent 65%), radial-gradient(ellipse 55% 45% at 95% 100%, rgba(82,19,217,0.12) 0%, transparent 60%), var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', padding: '20px' }}>
      <div style={{ position: 'relative', background: 'var(--bg-glass-strong)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid var(--border-strong)', borderRadius: 'var(--radius-xl)', padding: '48px 40px', width: '100%', maxWidth: 480, boxShadow: 'var(--shadow-xl), var(--shadow-glow-sm)' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <LexiiusLogo iconSize={28} fontSize={22} />
          <div style={{ color: 'var(--text-tertiary)', fontSize: 13, marginTop: 4 }}>Configuración inicial</div>
        </div>

        {/* Progress */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= step ? 'var(--accent)' : 'var(--border-default)', transition: 'background 0.3s' }} />
          ))}
        </div>

        {/* Step 0: Org name */}
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>¿Cómo se llama tu organización?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>Esto aparecerá en tu espacio de trabajo.</p>
            <input
              autoFocus
              type="text"
              value={orgName}
              onChange={e => setOrgName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              placeholder="Ej: Estudio García & Asociados"
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 15, boxSizing: 'border-box' }}
            />
          </>
        )}

        {/* Step 1: Description */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>¿A qué se dedica {orgName}?</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>Lexiius usará esto para adaptar sus respuestas a tu industria.</p>
            <textarea
              autoFocus
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Somos un estudio de abogados especializado en derecho laboral y contratos comerciales en Argentina..."
              rows={5}
              style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', fontFamily: 'var(--font-body)' }}
            />
          </>
        )}

        {/* Step 2: Confirm */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>¡Listo, {orgName}!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>Lexiius detectó que tu organización trabaja en el dominio:</p>
            <div style={{ background: 'var(--bg-accent-subtle)', border: '1px solid var(--accent)', borderRadius: 8, padding: '14px 18px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>
                {inferredDomain === 'legal' ? '⚖️' : inferredDomain === 'code' ? '💻' : inferredDomain === 'data' ? '📊' : '🧠'}
              </span>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--text-accent)' }}>{domainLabels[inferredDomain] || 'General'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>Las respuestas se adaptarán a este dominio</div>
              </div>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Podés cambiarlo más adelante desde Configuración.</p>
          </>
        )}

        {error && <p style={{ color: 'var(--text-error)', fontSize: 'var(--text-xs)', marginTop: 'var(--space-3)' }}>{error}</p>}

        <button
          onClick={handleNext}
          disabled={loading}
          style={{ width: '100%', marginTop: 'var(--space-5)', height: 'var(--btn-height-lg)', padding: '0 var(--space-4)', background: 'var(--accent)', color: 'var(--btn-primary-text)', border: 'none', borderRadius: 'var(--btn-radius)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: 'var(--shadow-glow-sm)', fontFamily: 'var(--font-body)', letterSpacing: 'var(--tracking-tight)' }}
        >
          {loading ? 'Procesando...' : step === 2 ? 'Empezar a usar Lexiius' : 'Continuar →'}
        </button>
      </div>
    </div>
  );
}
