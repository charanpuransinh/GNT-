import React, { useEffect } from 'react';
import { useWorkflowStore } from '../stores/useWorkflowStore';

interface ExecutionMonitorProps {
  executionId: string;
  autoRefresh?: boolean;
}

export const ExecutionMonitor: React.FC<ExecutionMonitorProps> = ({ executionId, autoRefresh = true }) => {
  const { executions, loadExecutions } = useWorkflowStore();
  const execution = executions.find(e => e.id === executionId);

  useEffect(() => {
    if (autoRefresh && execution?.status === 'RUNNING') {
      const interval = setInterval(() => loadExecutions(), 3000);
      return () => clearInterval(interval);
    }
  }, [execution?.status, autoRefresh]);

  if (!execution) return <div>Loading execution...</div>;

  const statusColors: Record<string, string> = {
    PENDING: '#ffd700',
    RUNNING: '#0969da',
    COMPLETED: '#1a7f37',
    FAILED: '#cf222e',
    CANCELLED: '#6e7781',
    TIMEOUT: '#cf222e'
  };

  return (
    <div className="execution-monitor" style={{ padding: 24, background: '#f6f8fa', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3>Execution #{execution.id.slice(0, 8)}</h3>
        <span style={{ 
          padding: '4px 12px', 
          borderRadius: 12, 
          background: statusColors[execution.status],
          color: execution.status === 'PENDING' ? '#000' : '#fff',
          fontSize: 12,
          fontWeight: 600
        }}>
          {execution.status}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div>
          <label style={{ fontSize: 12, color: '#6e7781' }}>Started</label>
          <div>{new Date(execution.startedAt).toLocaleString()}</div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6e7781' }}>Duration</label>
          <div>{execution.durationMs ? `${execution.durationMs}ms` : '—'}</div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6e7781' }}>Trigger</label>
          <div>{execution.triggerSource}</div>
        </div>
        <div>
          <label style={{ fontSize: 12, color: '#6e7781' }}>Triggered By</label>
          <div>{execution.createdBy || 'System'}</div>
        </div>
      </div>

      {execution.errorMessage && (
        <div style={{ padding: 12, background: '#ffebe9', border: '1px solid #ffdcd7', borderRadius: 6, marginBottom: 16 }}>
          <strong style={{ color: '#cf222e' }}>Error:</strong> {execution.errorMessage}
        </div>
      )}

      <h4 style={{ marginBottom: 12 }}>Step Execution Timeline</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {execution.steps?.map((step: any) => (
          <div key={step.id} style={{ 
            padding: 12, 
            background: '#fff', 
            border: '1px solid #d0d7de',
            borderRadius: 6,
            borderLeft: `4px solid ${statusColors[step.status] || '#6e7781'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{step.stepName}</strong>
              <span style={{ fontSize: 12, color: '#6e7781' }}>{step.status}</span>
            </div>
            {step.errorDetails && (
              <div style={{ fontSize: 12, color: '#cf222e', marginTop: 4 }}>
                {step.errorDetails.message}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
