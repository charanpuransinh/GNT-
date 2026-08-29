// M14 Frontend — Main App
// Lock: LOCK_09_COMPONENT
import React, { useState } from 'react';
import { JobDashboard } from './components/Dashboard/JobDashboard';
import { ImportUploader } from './components/Import/ImportUploader';
import { ImportProgress } from './components/Import/ImportProgress';
import { ImportJobList } from './components/Import/ImportJobList';
import { ExportBuilder } from './components/Export/ExportBuilder';
import { ExportProgress } from './components/Export/ExportProgress';
import { ExportJobList } from './components/Export/ExportJobList';
import { TemplateManager } from './components/Template/TemplateManager';
import { ImportJob, ExportJob, ImportTemplate } from './types';

type Tab = 'dashboard' | 'import' | 'export' | 'templates';

export const M14App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedImportJob, setSelectedImportJob] = useState<string | null>(null);
  const [selectedExportJob, setSelectedExportJob] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<ImportTemplate | null>(null);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'import', label: 'Import', icon: '📥' },
    { key: 'export', label: 'Export', icon: '📤' },
    { key: 'templates', label: 'Templates', icon: '📋' },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">M14 Import / Export</h1>
          <p className="text-sm text-gray-500">Bulk data operations across all modules</p>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === tab.key
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                <span className="mr-1">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && <JobDashboard />}

        {activeTab === 'import' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4">Upload File</h3>
                <ImportUploader
                  module="M05"
                  entityType="product"
                  templateId={selectedTemplate?.id}
                  onUploadComplete={(jobId) => setSelectedImportJob(jobId)}
                />
              </div>
              {selectedImportJob && <ImportProgress jobId={selectedImportJob} />}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Import History</h3>
              <ImportJobList onSelectJob={(job) => setSelectedImportJob(job.id)} />
            </div>
          </div>
        )}

        {activeTab === 'export' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <ExportBuilder onExportCreated={(jobId) => setSelectedExportJob(jobId)} />
              {selectedExportJob && <ExportProgress jobId={selectedExportJob} />}
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4">Export History</h3>
              <ExportJobList onSelectJob={(job) => setSelectedExportJob(job.id)} />
            </div>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-white rounded-lg shadow p-6">
            <TemplateManager onSelectTemplate={setSelectedTemplate} />
          </div>
        )}
      </main>
    </div>
  );
};
