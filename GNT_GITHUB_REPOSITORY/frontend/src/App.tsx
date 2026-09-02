/**
 * GNT — App shell (ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02)
 * AUDIT-01 F4: 314 frontend फाइलें थीं पर उन्हें खोलने वाला कोई पन्ना ही नहीं था।
 * ROUGH है — असली layout/theme/auth-guard का काम आगे के task में।
 */
import React, { Suspense } from 'react';
import { Link, Navigate, Route, Routes } from 'react-router-dom';
import { LoadingOverlay } from './components/feedback/LoadingOverlay';
import { NotFoundPage } from './modules/m01-foundation/pages/NotFoundPage';
import { navRoutes, routes } from './routes';

const Sidebar: React.FC = () => (
  <nav aria-label="मुख्य मेन्यू">
    <ul>
      {navRoutes.map((r) => (
        <li key={r.path}><Link to={r.path}>{r.label}</Link></li>
      ))}
    </ul>
  </nav>
);

export const App: React.FC = () => (
  <div data-app="gnt">
    <header><strong>GARUDA NEXTECH</strong></header>
    <div data-layout="main">
      <Sidebar />
      <main>
        <Suspense fallback={<LoadingOverlay message="पेज खुल रहा है…" />}>
          <Routes>
            <Route path="/" element={<Navigate to="/company" replace />} />
            {routes.map((r) => {
              const Page = r.element;
              return <Route key={r.path} path={r.path} element={<Page />} />;
            })}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  </div>
);

export default App;
