import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../m04-events/src/EventBus';
import { ActionRegistry } from '../actions/ActionRegistry';
import { Logger } from '../../../m01-foundation/src/Logger';

export class WorkflowEngine {
  private prisma: PrismaClient;
  private eventBus: EventBus;
  private actionRegistry: ActionRegistry;
  private logger: Logger;

  constructor(deps: { prisma: PrismaClient; eventBus: EventBus; actionRegistry: ActionRegistry }) {
    this.prisma = deps.prisma;
    this.eventBus = deps.eventBus;
    this.actionRegistry = deps.actionRegistry;
    this.logger = new Logger('WorkflowEngine');
  }

  async execute(workflowId: string, triggerData: any, context: ExecutionContext): Promise<ExecutionResult> {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id: workflowId, tenantId: context.tenantId, deletedAt: null }
    });

    if (!workflow) throw new Error('M13-AUT-001: WORKFLOW_NOT_FOUND');
    if (workflow.status !== 'ACTIVE') throw new Error('M13-AUT-002: INVALID_WORKFLOW_STATUS');

    const execution = await this.prisma.workflowExecution.create({
      data: {
        workflowId,
        tenantId: context.tenantId,
        status: 'RUNNING',
        triggerSource: context.triggerSource,
        triggerData,
        context: { ...triggerData, _meta: { startedAt: new Date().toISOString() } },
        createdBy: context.userId
      }
    });

    try {
      const steps = workflow.steps as WorkflowStep[];
      const startStep = steps.find(s => s.type === 'START') || steps[0];

      await this.executeStep(execution.id, startStep, steps, {
        ...execution.context,
        ...triggerData
      }, context.tenantId);

      const completed = await this.prisma.workflowExecution.update({
        where: { id: execution.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
          durationMs: Date.now() - execution.startedAt.getTime()
        }
      });

      await this.eventBus.publish('workflow.executed', {
        executionId: execution.id,
        workflowId,
        tenantId: context.tenantId,
        status: 'COMPLETED',
        durationMs: completed.durationMs
      });

      return { executionId: execution.id, status: 'COMPLETED' };

    } catch (error) {
      await this.handleExecutionFailure(execution.id, error, context);
      throw error;
    }
  }

  private async executeStep(
    executionId: string,
    step: WorkflowStep,
    allSteps: WorkflowStep[],
    context: any,
    tenantId: string
  ): Promise<any> {
    const stepExec = await this.prisma.workflowStepExecution.create({
      data: {
        executionId,
        stepId: step.id,
        stepType: step.type,
        stepName: step.name || step.type,
        status: 'RUNNING',
        inputData: context,
        tenantId
      }
    });

    try {
      if (step.condition && !this.evaluateCondition(step.condition, context)) {
        await this.prisma.workflowStepExecution.update({
          where: { id: stepExec.id },
          data: { status: 'SKIPPED', completedAt: new Date() }
        });
        return context;
      }

      const action = this.actionRegistry.get(step.type);
      if (!action) throw new Error(`M13-AUT-008: Unknown action type ${step.type}`);

      const result = await action.execute(step.config, context, { tenantId, executionId });
      const newContext = { ...context, [step.id]: result };

      await this.prisma.workflowStepExecution.update({
        where: { id: stepExec.id },
        data: {
          status: 'COMPLETED',
          outputData: result,
          completedAt: new Date()
        }
      });

      await this.eventBus.publish('step.completed', {
        executionId,
        stepId: step.id,
        stepType: step.type,
        durationMs: Date.now() - stepExec.startedAt.getTime()
      });

      const nextStepId = step.next || (step.onSuccess && result.success ? step.onSuccess : step.onError);
      if (nextStepId) {
        const nextStep = allSteps.find(s => s.id === nextStepId);
        if (nextStep) {
          return this.executeStep(executionId, nextStep, allSteps, newContext, tenantId);
        }
      }

      return newContext;

    } catch (error) {
      await this.prisma.workflowStepExecution.update({
        where: { id: stepExec.id },
        data: {
          status: 'FAILED',
          errorDetails: { message: error.message, stack: error.stack },
          completedAt: new Date()
        }
      });

      if (step.retry && stepExec.retryCount < (step.retry.maxAttempts || 3)) {
        await this.prisma.workflowStepExecution.update({
          where: { id: stepExec.id },
          data: { retryCount: { increment: 1 }, status: 'PENDING' }
        });
        await new Promise(r => setTimeout(r, step.retry.delayMs || 1000));
        return this.executeStep(executionId, step, allSteps, context, tenantId);
      }

      if (step.onError) {
        const errorStep = allSteps.find(s => s.id === step.onError);
        if (errorStep) {
          return this.executeStep(executionId, errorStep, allSteps, context, tenantId);
        }
      }

      throw error;
    }
  }

  private evaluateCondition(condition: string, context: any): boolean {
    const sandbox = { ...context, Math, Date, JSON };
    try {
      return new Function('context', `with(context) { return ${condition}; }`)(sandbox);
    } catch {
      return false;
    }
  }

  private async handleExecutionFailure(executionId: string, error: Error, context: ExecutionContext) {
    await this.prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: 'FAILED',
        errorMessage: error.message,
        completedAt: new Date()
      }
    });

    await this.eventBus.publish('workflow.failed', {
      executionId,
      workflowId: context.workflowId,
      tenantId: context.tenantId,
      error: error.message
    });
  }
}

interface ExecutionContext {
  tenantId: string;
  userId?: string;
  triggerSource: string;
  workflowId: string;
}

interface ExecutionResult {
  executionId: string;
  status: string;
}

interface WorkflowStep {
  id: string;
  type: string;
  name?: string;
  config: any;
  next?: string;
  onSuccess?: string;
  onError?: string;
  condition?: string;
  retry?: { maxAttempts: number; delayMs: number };
}
