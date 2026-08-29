import React from 'react';

interface Props {
  node: any;
  onChange: (config: any) => void;
  readOnly?: boolean;
}

export const StepConfigPanel: React.FC<Props> = ({ node, onChange, readOnly }) => {
  return (
    <div style={{ marginTop: 16 }}>
      <h4>Step Config: {node.data.label}</h4>
      <pre style={{ fontSize: 11, background: '#f6f8fa', padding: 8, borderRadius: 4 }}>
        {JSON.stringify(node.data.config, null, 2)}
      </pre>
    </div>
  );
};
