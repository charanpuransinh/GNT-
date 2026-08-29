import { ActionHandler, ActionMeta } from './ActionRegistry';

export class DelayAction implements ActionHandler {
  name = 'Wait/Delay';
  description = 'Pause workflow execution for a specified duration';

  configSchema = {
    type: 'object',
    properties: {
      durationMs: { type: 'number', description: 'Duration in milliseconds' },
      until: { type: 'string', description: 'ISO datetime or expression' }
    },
    required: ['durationMs']
  };

  async execute(config: any, context: any, meta: ActionMeta) {
    const delay = config.durationMs;
    if (delay > 300000) {
      throw new Error('Delays > 5 minutes require async queue implementation');
    }

    await new Promise(resolve => setTimeout(resolve, delay));
    return { success: true, delayedMs: delay };
  }
}
