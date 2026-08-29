import { EventEmitter } from 'events';
import { GST_EVENTS, EInvoiceGeneratedEvent, ReturnFiledEvent } from './gst.events';

const eventEmitter = new EventEmitter();

export const GSTEventHandlers = {
  initialize() {
    eventEmitter.on(GST_EVENTS.EINVOICE_GENERATED, (data: EInvoiceGeneratedEvent) => {
      console.log('[GST] E-Invoice generated:', data.irn);
    });
    eventEmitter.on(GST_EVENTS.RETURN_FILED, (data: ReturnFiledEvent) => {
      console.log('[GST] Return filed:', data.return_type, data.period);
    });
  },
  emitEInvoiceGenerated(data: EInvoiceGeneratedEvent) {
    eventEmitter.emit(GST_EVENTS.EINVOICE_GENERATED, data);
  },
  emitReturnFiled(data: ReturnFiledEvent) {
    eventEmitter.emit(GST_EVENTS.RETURN_FILED, data);
  },
};
