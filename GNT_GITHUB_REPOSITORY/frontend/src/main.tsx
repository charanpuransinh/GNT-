/** ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02। यही वो entry point है जो अब तक मौजूद ही नहीं था (AUDIT-01 F4)। */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('#root नहीं मिला — index.html देखें');

createRoot(container).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
