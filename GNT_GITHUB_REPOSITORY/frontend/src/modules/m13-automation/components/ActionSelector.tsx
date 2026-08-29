import React from 'react';

interface Props {
  onSelect: (actionType: string) => void;
}

const ACTIONS = [
  'SEND_EMAIL', 'SEND_NOTIFICATION', 'CREATE_RECORD', 'UPDATE_RECORD',
  'CALL_API', 'DELAY', 'CONDITION', 'TRANSFORM_DATA'
];

export const ActionSelector: React.FC<Props> = ({ onSelect }) => {
  return (
    <div style={{ marginBottom: 16 }}>
      <h4>Add Step</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ACTIONS.map(action => (
          <button
            key={action}
            onClick={() => onSelect(action)}
            style={{ textAlign: 'left', padding: '6px 8px', background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 4, fontSize: 12 }}
          >
            {action}
          </button>
        ))}
      </div>
    </div>
  );
};
