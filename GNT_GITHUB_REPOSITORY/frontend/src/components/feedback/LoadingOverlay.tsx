import React from 'react';

/** ROUGH SCAFFOLDING — समीक्षक AI, 2026-09-02। */
export interface LoadingOverlayProps {
  loading?: boolean;
  message?: string;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ loading = true, message = 'Loading…' }) =>
  loading ? <div role="status" aria-live="polite">{message}</div> : null;
