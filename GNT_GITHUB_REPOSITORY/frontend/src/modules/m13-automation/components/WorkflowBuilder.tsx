import React, { useState, useCallback } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useWorkflowStore } from '../stores/useWorkflowStore';
import { StepConfigPanel } from './StepConfigPanel';
import { ActionSelector } from './ActionSelector';

interface WorkflowBuilderProps {
  workflowId?: string;
  readOnly?: boolean;
}

export const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({ workflowId, readOnly }) => {
  const { selectedWorkflow, updateWorkflow } = useWorkflowStore();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = (_: any, node: any) => {
    setSelectedNode(node);
  };

  const handleSave = async () => {
    const steps = nodes.map(node => ({
      id: node.id,
      type: node.data.actionType,
      name: node.data.label,
      config: node.data.config,
      next: edges.find(e => e.source === node.id)?.target,
      position: node.position
    }));

    if (workflowId) {
      await updateWorkflow(workflowId, { steps });
    }
  };

  const addNode = (actionType: string) => {
    const newNode = {
      id: `step_${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400, y: Math.random() * 400 },
      data: { label: actionType, actionType, config: {} }
    };
    setNodes((nds) => [...nds, newNode]);
  };

  return (
    <div className="workflow-builder" style={{ height: '80vh', display: 'flex' }}>
      <div style={{ flex: 1, border: '1px solid #e1e4e8', borderRadius: 8 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          fitView
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      <div style={{ width: 320, padding: 16, borderLeft: '1px solid #e1e4e8' }}>
        {!readOnly && <ActionSelector onSelect={addNode} />}

        {selectedNode && (
          <StepConfigPanel
            node={selectedNode}
            onChange={(config) => {
              setNodes(nds => nds.map(n => 
                n.id === selectedNode.id ? { ...n, data: { ...n.data, config } } : n
              ));
            }}
            readOnly={readOnly}
          />
        )}

        {!readOnly && (
          <button 
            onClick={handleSave}
            style={{ marginTop: 16, width: '100%', padding: 12, background: '#0969da', color: 'white', border: 'none', borderRadius: 6 }}
          >
            Save Workflow
          </button>
        )}
      </div>
    </div>
  );
};
