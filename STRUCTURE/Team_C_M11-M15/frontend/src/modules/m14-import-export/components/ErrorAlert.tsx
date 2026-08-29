// M14 Frontend — ErrorAlert
// Lock: LOCK_04_COMPONENT
import React from 'react';

interface Props {
  message: string | null;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<Props> = ({ message, onDismiss }) => {
  if (!message) return null;
  return (
    <div className="rounded-md bg-red-50 p-4 mb-4">
      <div className="flex">
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">Error</h3>
          <div className="mt-2 text-sm text-red-700">{message}</div>
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="ml-auto text-red-400 hover:text-red-600">
            ✕
          </button>
        )}
      </div>
    </div>
  );
};
