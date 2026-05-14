import React from 'react';
import '../styles/integrations.css';

export function Integrations() {
  return (
    <div className="integrations-coming-soon">
      <div className="integrations-coming-soon__icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101"/>
          <path d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101"/>
        </svg>
      </div>
      <h2 className="integrations-coming-soon__title">Integraciones</h2>
      <p className="integrations-coming-soon__description">
        Próximamente podrás conectar Iurivia con las herramientas que ya usás en tu estudio.
      </p>
      <div className="integrations-coming-soon__pills">
        <span className="integrations-pill">Gmail</span>
        <span className="integrations-pill">Google Drive</span>
        <span className="integrations-pill">WhatsApp</span>
        <span className="integrations-pill">Notion</span>
        <span className="integrations-pill">Slack</span>
      </div>
    </div>
  );
}
