-- GNT TEAM C - MIGRATIONS
-- File: 001_M11_payment_master.sql
-- Module: M11 - Payment Management
-- Created: 2026-08-22
-- Status: IMPLEMENTED

-- Create payment_master table for storing all payment records
CREATE TABLE IF NOT EXISTS payment_master (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id VARCHAR(36) NOT NULL COMMENT 'Reference to company_master',
  branch_id VARCHAR(36) COMMENT 'Reference to branch (optional)',
  invoice_id VARCHAR(36) COMMENT 'Reference to sales_invoice (for sales payments)',
  party_id VARCHAR(36) COMMENT 'Reference to party_master (payable to/from)',
  payment_mode VARCHAR(20) NOT NULL COMMENT 'cash, cheque, bank_transfer, upi, credit_card, debit_card, digital_wallet',
  payment_date DATE NOT NULL COMMENT 'Date of payment',
  amount DECIMAL(15,2) NOT NULL COMMENT 'Payment amount',
  reference_no VARCHAR(100) COMMENT 'Cheque number, bank reference, UTR, etc.',
  bank_id VARCHAR(36) COMMENT 'Reference to bank_master (for bank transfers)',
  bank_account_id VARCHAR(36) COMMENT 'Bank account used for payment',
  
  -- Payment Status Tracking
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, cleared, failed, reconciled, reversed, cancelled',
  cleared_date DATE COMMENT 'When payment was cleared/confirmed',
  reconciled_date DATE COMMENT 'When payment was reconciled in accounting',
  
  -- For multi-invoice payments
  total_amount DECIMAL(15,2) COMMENT 'Total payment if paying multiple invoices',
  remark TEXT COMMENT 'Payment remarks/notes',
  
  -- Audit & Tracking
  created_by VARCHAR(36) COMMENT 'User who recorded the payment',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_by VARCHAR(36) COMMENT 'User who last updated',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT fk_payment_company FOREIGN KEY (company_id) REFERENCES company_master(id),
  CONSTRAINT fk_payment_branch FOREIGN KEY (branch_id) REFERENCES branch_master(id),
  CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES sales_invoice(id),
  CONSTRAINT fk_payment_party FOREIGN KEY (party_id) REFERENCES party_master(id),
  CONSTRAINT fk_payment_bank FOREIGN KEY (bank_id) REFERENCES bank_master(id),
  CONSTRAINT fk_payment_bank_account FOREIGN KEY (bank_account_id) REFERENCES bank_account_master(id),
  
  INDEX idx_payment_company (company_id),
  INDEX idx_payment_invoice (invoice_id),
  INDEX idx_payment_party (party_id),
  INDEX idx_payment_status (status),
  INDEX idx_payment_date (payment_date),
  INDEX idx_payment_mode (payment_mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='M11 Payment Master — stores all incoming and outgoing payments';

-- Create payment_detail table for itemized payments (one payment may cover multiple invoices)
CREATE TABLE IF NOT EXISTS payment_detail (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  payment_id VARCHAR(36) NOT NULL COMMENT 'Reference to payment_master',
  invoice_id VARCHAR(36) NOT NULL COMMENT 'Invoice being paid',
  invoice_amount DECIMAL(15,2) NOT NULL COMMENT 'Outstanding amount on invoice',
  payment_amount DECIMAL(15,2) NOT NULL COMMENT 'Amount applied to this invoice',
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_paydetail_payment FOREIGN KEY (payment_id) REFERENCES payment_master(id) ON DELETE CASCADE,
  CONSTRAINT fk_paydetail_invoice FOREIGN KEY (invoice_id) REFERENCES sales_invoice(id),
  INDEX idx_paydetail_payment (payment_id),
  INDEX idx_paydetail_invoice (invoice_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='M11 Payment Detail — itemization of payments across invoices';

-- Create payment_reconciliation table for bank reconciliation tracking
CREATE TABLE IF NOT EXISTS payment_reconciliation (
  id VARCHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
  company_id VARCHAR(36) NOT NULL COMMENT 'Reference to company_master',
  bank_account_id VARCHAR(36) NOT NULL COMMENT 'Bank account being reconciled',
  statement_date DATE NOT NULL COMMENT 'Bank statement date',
  statement_open_balance DECIMAL(15,2) COMMENT 'Opening balance per bank',
  statement_close_balance DECIMAL(15,2) NOT NULL COMMENT 'Closing balance per bank',
  system_balance DECIMAL(15,2) NOT NULL COMMENT 'Closing balance in our system',
  difference DECIMAL(15,2) COMMENT 'Difference (statement_close - system_balance)',
  reconciliation_status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, matched, unmatched, approved',
  matched_on DATE COMMENT 'Date of reconciliation match',
  remarks TEXT,
  
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  CONSTRAINT fk_recon_company FOREIGN KEY (company_id) REFERENCES company_master(id),
  CONSTRAINT fk_recon_bank_account FOREIGN KEY (bank_account_id) REFERENCES bank_account_master(id),
  INDEX idx_recon_company (company_id),
  INDEX idx_recon_bank_account (bank_account_id),
  INDEX idx_recon_status (reconciliation_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='M11 Payment Reconciliation — bank statement matching & reconciliation';