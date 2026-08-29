// M14 Frontend — StatusBadge
// Lock: LOCK_04_COMPONENT
import React from 'react';
import { ImportStatus, ExportStatus } from '../../types';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  VALIDATING: 'bg-blue-100 text-blue-800 border-blue-300',
  PROCESSING: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  COMPLETED: 'bg-green-100 text-green-800 border-green-300',
  FAILED: 'bg-red-100 text-red-800 border-red-300',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-300',
};

interface Props {
  status: ImportStatus | ExportStatus;
}

export const StatusBadge: React.FC<Props> = ({ status }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status] || 'bg-gray-100 text-gray-800'}`}>
    {status}
  </span>
);
