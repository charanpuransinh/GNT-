import { SendEmailAction } from './SendEmailAction';
import { SendNotificationAction } from './SendNotificationAction';
import { CreateRecordAction } from './CreateRecordAction';
import { UpdateRecordAction } from './UpdateRecordAction';
import { CallAPIAction } from './CallAPIAction';
import { DelayAction } from './DelayAction';
import { ConditionAction } from './ConditionAction';
import { TransformDataAction } from './TransformDataAction';

export class ActionRegistry {
  private actions = new Map<string, ActionHandler>();

  constructor() {
    this.register('SEND_EMAIL', new SendEmailAction());
    this.register('SEND_NOTIFICATION', new SendNotificationAction());
    this.register('CREATE_RECORD', new CreateRecordAction());
    this.register('UPDATE_RECORD', new UpdateRecordAction());
    this.register('CALL_API', new CallAPIAction());
    this.register('DELAY', new DelayAction());
    this.register('CONDITION', new ConditionAction());
    this.register('TRANSFORM_DATA', new TransformDataAction());
  }

  register(type: string, handler: ActionHandler) {
    this.actions.set(type, handler);
  }

  get(type: string): ActionHandler | undefined {
    return this.actions.get(type);
  }

  getAll(): ActionDefinition[] {
    return Array.from(this.actions.entries()).map(([type, handler]) => ({
      type,
      name: handler.name,
      description: handler.description,
      configSchema: handler.configSchema,
      inputSchema: handler.inputSchema,
      outputSchema: handler.outputSchema
    }));
  }
}

export interface ActionHandler {
  name: string;
  description: string;
  configSchema: JSONSchema;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
  execute(config: any, context: any, meta: ActionMeta): Promise<any>;
}

export interface ActionMeta {
  tenantId: string;
  executionId: string;
}

export interface ActionDefinition {
  type: string;
  name: string;
  description: string;
  configSchema: JSONSchema;
  inputSchema?: JSONSchema;
  outputSchema?: JSONSchema;
}

interface JSONSchema {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
}
