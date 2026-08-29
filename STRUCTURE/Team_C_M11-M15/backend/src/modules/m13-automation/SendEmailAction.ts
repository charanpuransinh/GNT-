import { ActionHandler, ActionMeta } from './ActionRegistry';
import { NotificationService } from '../../../m06-notifications/src/NotificationService';

export class SendEmailAction implements ActionHandler {
  name = 'Send Email';
  description = 'Send an email to specified recipients using templates';

  configSchema = {
    type: 'object',
    properties: {
      to: { type: 'string', description: 'Email address or template expression' },
      subject: { type: 'string' },
      templateId: { type: 'string' },
      variables: { type: 'object' }
    },
    required: ['to', 'subject']
  };

  async execute(config: any, context: any, meta: ActionMeta) {
    const notificationService = new NotificationService();

    const resolvedTo = this.resolveTemplate(config.to, context);
    const resolvedSubject = this.resolveTemplate(config.subject, context);
    const variables = this.resolveObject(config.variables || {}, context);

    await notificationService.sendEmail({
      to: resolvedTo,
      subject: resolvedSubject,
      templateId: config.templateId,
      variables,
      tenantId: meta.tenantId,
      metadata: { executionId: meta.executionId, source: 'automation' }
    });

    return { success: true, sentTo: resolvedTo };
  }

  private resolveTemplate(template: string, context: any): string {
    return template.replace(/\{\{(.*?)\}\}/g, (match, path) => {
      const keys = path.trim().split('.');
      let value = context;
      for (const key of keys) {
        value = value?.[key];
      }
      return value || match;
    });
  }

  private resolveObject(obj: any, context: any): any {
    if (typeof obj === 'string') return this.resolveTemplate(obj, context);
    if (Array.isArray(obj)) return obj.map(v => this.resolveObject(v, context));
    if (typeof obj === 'object' && obj !== null) {
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, this.resolveObject(v, context)])
      );
    }
    return obj;
  }
}
