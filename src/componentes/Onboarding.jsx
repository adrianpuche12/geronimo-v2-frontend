import { LexiiusLogo } from './LexiiusLogo';
import React, { useState } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || '/api';

const ESPECIALIDADES = [
  { value: 'laboral',       label: 'Derecho laboral' },
  { value: 'familia',       label: 'Derecho de familia' },
  { value: 'penal',         label: 'Derecho penal' },
  { value: 'societario',    label: 'Derecho societario / empresarial' },
  { value: 'civil_danos',   label: 'Derecho civil / daños y perjuicios' },
  { value: 'tributario',    label: 'Derecho tributario' },
  { value: 'concursal',     label: 'Derecho concursal / quiebras' },
  { value: 'inmobiliario',  label: 'Derecho inmobiliario / locaciones' },
  { value: 'administrativo',label: 'Derecho administrativo' },
  { value: 'otro',          label: 'Otra especialidad' },
];

const JURISDICCIONES = ['CABA', 'Provincia de Buenos Aires', 'Córdoba', 'Mendoza', 'Santa Fe', 'Otra'];

const TOTAL_STEPS = 5;

const inputStyle = {
  width: '100%', padding: '10px 14px',
  background: 'var(--bg-surface-2)', border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-md)', color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)', boxSizing: 'border-box', fontFamily: 'var(--font-body)',
};

const labelStyle = {
  display: 'block', fontSize: 'var(--text-xs)', fontWeight: 600,
  color: 'var(--text-secondary)', marginBottom: 6, letterSpacing: '0.04em',
};

const optionalBadge = (
  <span style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)',
    background: 'var(--bg-surface-2)', border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-full)', padding: '1px 6px', marginLeft: 6 }}>
    opcional
  </span>
);

const benefitNote = (text) => (
  <p style={{ margin: '6px 0 0', fontSize: 11, color: 'var(--text-muted)',
    fontStyle: 'italic', lineHeight: 1.4 }}>
    💡 {text}
  </p>
);

export function Onboarding({ onComplete }) {
  const [step, setStep]             = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');
  const [inferredDomain, setInferredDomain] = useState('');

  // Paso 0 — datos personales
  const [nombre, setNombre]         = useState('');
  const [apellido, setApellido]     = useState('');
  const [matricula, setMatricula]   = useState('');

  // Paso 1 — tipo
  const [tipo, setTipo]             = useState('');

  // Paso 2 — datos del estudio / independiente
  const [estudioNombre, setEstudioNombre] = useState('');
  const [tamano, setTamano]         = useState('');
  const [jurisdiccion, setJurisdiccion] = useState('');

  // Paso 3 — especialidades
  const [especialidades, setEspecialidades] = useState([]);

  // Paso 4 — descripción libre
  const [description, setDescription] = useState('');

  const toggleEsp = (v) =>
    setEspecialidades(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);

  const orgName = tipo === 'estudio'
    ? (estudioNombre || `${nombre} ${apellido}`.trim())
    : `${nombre} ${apellido}`.trim();

  const validate = () => {
    if (step === 0 && !nombre.trim()) return 'Ingresá tu nombre.';
    if (step === 0 && !apellido.trim()) return 'Ingresá tu apellido.';
    if (step === 1 && !tipo) return 'Seleccioná el tipo de práctica.';
    if (step === 2 && tipo === 'estudio' && !estudioNombre.trim()) return 'Ingresá el nombre del estudio.';
    return '';
  };

  const handleNext = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');

    if (step === 4) {
      // Submit
      setLoading(true);
      try {
        const descFinal = description.trim() ||
          `${tipo === 'estudio' ? `Estudio ${estudioNombre}` : 'Abogado/a independiente'}. ` +
          (especialidades.length ? `Especialidades: ${especialidades.join(', ')}.` : '') +
          (jurisdiccion ? ` Jurisdicción: ${jurisdiccion}.` : '');

        const res = await axios.post(API_URL + '/onboarding/complete', {
          orgName: orgName || 'Mi estudio',
          description: descFinal,
          perfilAbogado: {
            nombre: nombre.trim() || undefined,
            apellido: apellido.trim() || undefined,
            matricula: matricula.trim() || undefined,
            tipo,
            estudio_nombre: estudioNombre.trim() || undefined,
            tamano: tamano || undefined,
            jurisdiccion: jurisdiccion || undefined,
            especialidades: especialidades.length ? especialidades : undefined,
          },
        });
        setInferredDomain(res.data.inferredDomain || 'legal');
        setStep(5);
      } catch {
        setError('Error al guardar el perfil. Intentá de nuevo.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === 5) { onComplete(inferredDomain); return; }
    setStep(s => s + 1);
  };

  const cardStyle = {
    position: 'relative',
    background: 'var(--bg-glass-strong)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid var(--border-strong)',
    borderRadius: 'var(--radius-xl)',
    padding: '48px 40px',
    width: '100%', maxWidth: 500,
    boxShadow: 'var(--shadow-xl), var(--shadow-glow-sm)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse 80% 55% at 50% -5%, rgba(109,40,217,0.18) 0%, transparent 65%), var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-body)', padding: 20,
    }}>
      <div style={cardStyle}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <LexiiusLogo iconSize={26} fontSize={20} />
          <div style={{ color: 'var(--text-tertiary)', fontSize: 12, marginTop: 4 }}>
            Configuración inicial — {step < 5 ? `Paso ${step + 1} de ${TOTAL_STEPS}` : '¡Listo!'}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 32 }}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i < step ? 'var(--accent)' : i === step ? 'var(--accent-hover)' : 'var(--border-default)',
              transition: 'background 0.3s',
            }} />
          ))}
        </div>

        {/* ── Paso 0: Datos personales ── */}
        {step === 0 && (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Tus datos personales
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24, lineHeight: 1.5 }}>
              Esta información se usa para personalizar el servicio y las respuestas del sistema.
            </p>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Nombre *</label>
                <input autoFocus style={inputStyle} value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Juan" onKeyDown={e => e.key === 'Enter' && handleNext()} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={labelStyle}>Apellido *</label>
                <input style={inputStyle} value={apellido} onChange={e => setApellido(e.target.value)} placeholder="García" onKeyDown={e => e.key === 'Enter' && handleNext()} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>Matrícula profesional {optionalBadge}</label>
              <input style={inputStyle} value={matricula} onChange={e => setMatricula(e.target.value)} placeholder="Ej: CPACF 12345" />
              {benefitNote('Con tu matrícula podemos identificar tu colegio y adaptar plazos procesales automáticamente.')}
            </div>
          </>
        )}

        {/* ── Paso 1: Tipo de práctica ── */}
        {step === 1 && (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              ¿Cómo ejercés?
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>
              Esto nos ayuda a configurar correctamente tu espacio de trabajo.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { value: 'independiente', label: 'Soy abogado/a independiente', desc: 'Ejercés de forma autónoma sin pertenecer a un estudio.' },
                { value: 'estudio',       label: 'Pertenezco a un estudio jurídico', desc: 'Formás parte de una firma o estudio con otros abogados.' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setTipo(opt.value)}
                  style={{
                    padding: '14px 18px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: tipo === opt.value ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                    background: tipo === opt.value ? 'var(--bg-accent-muted)' : 'var(--bg-surface-1)',
                    textAlign: 'left', transition: 'var(--transition-fast)',
                  }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 'var(--text-sm)' }}>{opt.label}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: 2 }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Paso 2: Datos del estudio / jurisdicción ── */}
        {step === 2 && (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              {tipo === 'estudio' ? 'Tu estudio' : 'Tu práctica'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 24 }}>
              Completá los datos que apliquen. Los opcionales mejoran la precisión del sistema.
            </p>

            {tipo === 'estudio' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Nombre del estudio *</label>
                <input autoFocus style={inputStyle} value={estudioNombre} onChange={e => setEstudioNombre(e.target.value)} placeholder="Ej: García & Asociados" />
              </div>
            )}

            {tipo === 'estudio' && (
              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Cantidad de abogados {optionalBadge}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['1-3', '4-10', '+10'].map(t => (
                    <button key={t} onClick={() => setTamano(t)}
                      style={{
                        flex: 1, padding: '8px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                        border: tamano === t ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                        background: tamano === t ? 'var(--bg-accent-muted)' : 'var(--bg-surface-1)',
                        color: tamano === t ? 'var(--text-accent)' : 'var(--text-secondary)',
                        fontSize: 'var(--text-sm)', fontWeight: 600,
                      }}>{t}</button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label style={labelStyle}>Jurisdicción principal {optionalBadge}</label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={jurisdiccion} onChange={e => setJurisdiccion(e.target.value)}>
                <option value="">Seleccioná...</option>
                {JURISDICCIONES.map(j => <option key={j} value={j}>{j}</option>)}
              </select>
              {benefitNote('Con tu jurisdicción cargamos automáticamente los plazos procesales y el fuero correcto en cada caso.')}
            </div>
          </>
        )}

        {/* ── Paso 3: Especialidades ── */}
        {step === 3 && (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Tus especialidades
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 6 }}>
              Marcá todas las áreas en las que trabajás. {optionalBadge}
            </p>
            {benefitNote('Iurivia priorizará la jurisprudencia y normas más relevantes para tu práctica.')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 18 }}>
              {ESPECIALIDADES.map(esp => (
                <button key={esp.value} onClick={() => toggleEsp(esp.value)}
                  style={{
                    padding: '10px 14px', borderRadius: 'var(--radius-md)', cursor: 'pointer',
                    border: especialidades.includes(esp.value) ? '2px solid var(--accent)' : '1px solid var(--border-default)',
                    background: especialidades.includes(esp.value) ? 'var(--bg-accent-muted)' : 'var(--bg-surface-1)',
                    color: especialidades.includes(esp.value) ? 'var(--text-accent)' : 'var(--text-secondary)',
                    textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 10,
                  }}>
                  <span style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: especialidades.includes(esp.value) ? '2px solid var(--accent)' : '2px solid var(--border-default)',
                    background: especialidades.includes(esp.value) ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {especialidades.includes(esp.value) && (
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                    )}
                  </span>
                  {esp.label}
                </button>
              ))}
            </div>
          </>
        )}

        {/* ── Paso 4: Descripción libre ── */}
        {step === 4 && (
          <>
            <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 6 }}>
              Contanos más {optionalBadge}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 6, lineHeight: 1.5 }}>
              Describí cómo trabajás, en qué casos te especializás, o qué tipo de clientes atendés. Iurivia usará esto para adaptar las respuestas a tu práctica real.
            </p>
            {benefitNote('Cuanto más específico, mejores serán las respuestas del sistema.')}
            <textarea
              autoFocus
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ej: Me especializo en despidos de empleados jerárquicos. Trabajo principalmente con empresas medianas en CABA y GBA. La mayoría de mis casos son en el fuero laboral nacional..."
              rows={6}
              style={{ ...inputStyle, resize: 'vertical', marginTop: 16 }}
            />
            <p style={{ fontSize: 11, color: 'var(--text-disabled)', marginTop: 8 }}>
              Podés saltear este paso — podrás completarlo más adelante desde tu perfil.
            </p>
          </>
        )}

        {/* ── Paso 5: Confirmación ── */}
        {step === 5 && (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
                background: 'var(--bg-success)', border: '1px solid var(--border-success)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-success)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                ¡Todo listo, {nombre}!
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                Tu perfil fue configurado correctamente. Iurivia adaptará sus respuestas a tu práctica.
              </p>
            </div>
            <div style={{
              background: 'var(--bg-surface-1)', border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)', padding: '14px 18px',
            }}>
              {nombre && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Profesional:</strong> Dr./Dra. {nombre} {apellido}
              </div>}
              {tipo === 'estudio' && estudioNombre && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Estudio:</strong> {estudioNombre}
              </div>}
              {jurisdiccion && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 4 }}>
                <strong style={{ color: 'var(--text-primary)' }}>Jurisdicción:</strong> {jurisdiccion}
              </div>}
              {especialidades.length > 0 && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>Especialidades:</strong> {especialidades.map(e => ESPECIALIDADES.find(x => x.value === e)?.label).join(', ')}
              </div>}
            </div>
          </>
        )}

        {error && <p style={{ color: 'var(--text-error)', fontSize: 'var(--text-xs)', marginTop: 12 }}>{error}</p>}

        {/* Botones */}
        <div style={{ display: 'flex', gap: 10, marginTop: 28 }}>
          {step > 0 && step < 5 && (
            <button onClick={() => { setStep(s => s - 1); setError(''); }}
              style={{ padding: '0 var(--space-4)', height: 'var(--btn-height-lg)', background: 'transparent', border: '1px solid var(--border-default)', borderRadius: 'var(--btn-radius)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', cursor: 'pointer' }}>
              ← Atrás
            </button>
          )}
          <button onClick={handleNext} disabled={loading}
            style={{ flex: 1, height: 'var(--btn-height-lg)', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--btn-radius)', fontSize: 'var(--text-sm)', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'var(--font-body)' }}>
            {loading ? 'Guardando...' : step === 4 ? 'Finalizar configuración' : step === 5 ? 'Empezar a usar Iurivia →' : step === 3 && especialidades.length === 0 ? 'Saltar →' : 'Continuar →'}
          </button>
        </div>

      </div>
    </div>
  );
}
