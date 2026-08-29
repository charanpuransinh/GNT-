/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M14 IMPORT/EXPORT — ROUTES                                  ║
 * ║  Lock Artifact #5 — React Router Configuration               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import ImportExportLayout from '../components/ImportExportLayout';
import ImportListPage from '../pages/ImportListPage';
import ImportWizardPage from '../pages/ImportWizardPage';
import ExportListPage from '../pages/ExportListPage';
import ExportWizardPage from '../pages/ExportWizardPage';
import TemplatesPage from '../pages/TemplatesPage';

const ImportExportRoutes = () => {
  return (
    <Routes>
      <Route element={<ImportExportLayout />}>
        <Route index element={<Navigate to="imports" replace />} />
        <Route path="imports" element={<ImportListPage />} />
        <Route path="imports/new" element={<ImportWizardPage />} />
        <Route path="imports/:id" element={<ImportWizardPage viewMode />} />
        <Route path="exports" element={<ExportListPage />} />
        <Route path="exports/new" element={<ExportWizardPage />} />
        <Route path="exports/:id" element={<ExportWizardPage viewMode />} />
        <Route path="templates" element={<TemplatesPage />} />
      </Route>
    </Routes>
  );
};

export default ImportExportRoutes;
