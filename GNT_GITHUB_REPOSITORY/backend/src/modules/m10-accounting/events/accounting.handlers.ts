import { EventEmitter } from 'events';
import { ACCOUNTING_EVENTS, LedgerEntryCreatedEvent, VoucherPostedEvent } from './accounting.events';

const eventEmitter = new EventEmitter();

export const AccountingEventHandlers = {
  initialize() {
    eventEmitter.on(ACCOUNTING_EVENTS.LEDGER_ENTRY_CREATED, (data: LedgerEntryCreatedEvent) => {
      console.log('[Accounting] Ledger entry created:', data.ledger_id);
    });
    eventEmitter.on(ACCOUNTING_EVENTS.VOUCHER_POSTED, (data: VoucherPostedEvent) => {
      console.log('[Accounting] Voucher posted:', data.voucher_id, data.voucher_type);
    });
  },
  emitLedgerEntryCreated(data: LedgerEntryCreatedEvent) {
    eventEmitter.emit(ACCOUNTING_EVENTS.LEDGER_ENTRY_CREATED, data);
  },
  emitVoucherPosted(data: VoucherPostedEvent) {
    eventEmitter.emit(ACCOUNTING_EVENTS.VOUCHER_POSTED, data);
  },
};
