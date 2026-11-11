// KOMPONEN : Loading
// PERAN    : Indikator loading bertema EtaCafe (kopi & cincin loader Figma)

import React from 'react';
import './Loading.css';

export interface LoadingProps {
  message?: string;
  fullscreen?: boolean;
}

export default function Loading({
  message = 'Memuat data EtaCafe...',
  fullscreen = false,
}: LoadingProps) {
  return (
    <div
      className={`etacafe-loading-container ${
        fullscreen ? 'etacafe-loading--fullscreen' : ''
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="etacafe-loader-graphic">
        <div className="etacafe-loader-ring"></div>
        <span className="etacafe-loader-cup" role="img" aria-label="Kopi">
          ☕
        </span>
      </div>
      {message && <p className="etacafe-loading-text">{message}</p>}
    </div>
  );
}
