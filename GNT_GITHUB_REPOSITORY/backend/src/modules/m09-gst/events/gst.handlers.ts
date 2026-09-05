import { EventEmitter } from 'events';
import { eventBus } from '@/common/events/event-bus';
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
  // पहले सिर्फ़ इसी फ़ाइल के private EventEmitter पर जाता था — कोई और module
  // (M13 का automation rule engine — blueprint §7.13: M13 USES M09) कभी नहीं
  // पकड़ पाता था। अब साझा bus पर भी, ताकि compliance-alert rules असल में चलें।
  emitEInvoiceGenerated(data: EInvoiceGeneratedEvent) {
    eventEmitter.emit(GST_EVENTS.EINVOICE_GENERATED, data);
    void eventBus.publish(GST_EVENTS.EINVOICE_GENERATED, data);
  },
  emitReturnFiled(data: ReturnFiledEvent) {
    eventEmitter.emit(GST_EVENTS.RETURN_FILED, data);
    void eventBus.publish(GST_EVENTS.RETURN_FILED, data);
  },
};
