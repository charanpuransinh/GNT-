public_methods:
  backend:
    - name: executeWorkflow
      signature: (workflowId, triggerData, context) => Promise<Execution>
      access: M04 EventBus, M03 API Gateway
    - name: registerEventTrigger
      signature: (eventType, workflowId, filter) => Promise<Trigger>
      access: M04 EventBus subscribers
    - name: getActionDefinitions
      signature: () => Promise<ActionDefinition[]>
      access: All modules (for UI consistency)
    - name: cancelExecution
      signature: (executionId) => Promise<boolean>
      access: M03 API Gateway
    - name: getExecutionStatus
      signature: (executionId) => Promise<ExecutionStatus>
      access: All modules

  frontend:
    - name: WorkflowBuilder
      type: React Component
      props: { workflowId?, onSave, readOnly? }
    - name: ExecutionMonitor
      type: React Component
      props: { executionId, autoRefresh? }
    - name: useWorkflowStore
      type: Zustand Hook
      exports: [workflows, executions, createWorkflow, executeWorkflow, loadExecutions]
    - name: ActionSelector
      type: React Component
      props: { value, onChange, actionTypes[] }
