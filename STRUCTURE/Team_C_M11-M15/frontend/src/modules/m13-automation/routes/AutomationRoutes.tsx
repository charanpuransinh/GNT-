/**
 * ╔═══════════════════════════════════════════════════════════════╗
 * ║  M13 AUTOMATION — ROUTES                                     ║
 * ║  Lock Artifact #5 — React Router Configuration               ║
 * ╚═══════════════════════════════════════════════════════════════╝
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import AutomationLayout from '../components/AutomationLayout';
import WorkflowListPage from '../pages/WorkflowListPage';
import WorkflowBuilderPage from '../pages/WorkflowBuilderPage';
import ScheduledJobsPage from '../pages/ScheduledJobsPage';
import ExecutionLogsPage from '../pages/ExecutionLogsPage';
import TemplatesPage from '../pages/TemplatesPage';
import RulesPage from '../pages/RulesPage';

const AutomationRoutes = () => {
  return (
    <Routes>
      <Route element={<AutomationLayout />}>
        <Route index element={<Navigate to="workflows" replace />} />
        <Route path="workflows" element={<WorkflowListPage />} />
        <Route path="workflows/new" element={<WorkflowBuilderPage mode="create" />} />
        <Route path="workflows/:id/edit" element={<WorkflowBuilderPage mode="edit" />} />
        <Route path="workflows/:id" element={<WorkflowBuilderPage mode="view" />} />
        <Route path="schedules" element={<ScheduledJobsPage />} />
        <Route path="logs" element={<ExecutionLogsPage />} />
        <Route path="templates" element={<TemplatesPage />} />
        <Route path="rules" element={<RulesPage />} />
      </Route>
    </Routes>
  );
};

export default AutomationRoutes;
