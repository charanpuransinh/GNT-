import React from 'react'; export const LoadingOverlay: React.FC<{loading?:boolean}> = ({loading=true}) => loading ? <div role="status" aria-live="polite">Loading…</div> : null;
