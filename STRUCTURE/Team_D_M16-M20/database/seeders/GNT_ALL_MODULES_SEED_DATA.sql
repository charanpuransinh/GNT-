-- GNT Team C — Seed Data for All Modules (M11-M15)
-- Run after migrations are applied

-- ───────────────────────────────────────────────
-- M11 PAYMENT SEED DATA
-- ───────────────────────────────────────────────

INSERT INTO m11_payment_methods (id, tenant_id, name, type, config, is_active, created_at) VALUES
('pm_001', 'tenant_demo', 'Cash', 'cash', '{}', true, NOW()),
('pm_002', 'tenant_demo', 'Bank Transfer', 'bank_transfer', '{"accountNumber": "1234567890"}', true, NOW()),
('pm_003', 'tenant_demo', 'UPI', 'upi', '{"vpa": "demo@gnt"}', true, NOW()),
('pm_004', 'tenant_demo', 'Credit Card', 'card', '{"gateway": "stripe"}', true, NOW());

INSERT INTO m11_bank_accounts (id, tenant_id, account_name, account_number, bank_name, ifsc_code, branch, balance, is_active, created_at) VALUES
('ba_001', 'tenant_demo', 'Primary Business Account', '123456789012', 'HDFC Bank', 'HDFC0001234', 'Mumbai Main', 500000.00, true, NOW()),
('ba_002', 'tenant_demo', 'Payroll Account', '987654321098', 'ICICI Bank', 'ICIC0005678', 'Delhi Branch', 250000.00, true, NOW());

INSERT INTO m11_invoices (id, tenant_id, invoice_number, customer_name, customer_email, amount, tax_amount, total_amount, status, due_date, created_at) VALUES
('inv_001', 'tenant_demo', 'INV-2026-0001', 'Acme Corp', 'billing@acme.com', 10000.00, 1800.00, 11800.00, 'paid', '2026-09-01', NOW()),
('inv_002', 'tenant_demo', 'INV-2026-0002', 'Globex Inc', 'accounts@globex.com', 25000.00, 4500.00, 29500.00, 'pending', '2026-09-15', NOW()),
('inv_003', 'tenant_demo', 'INV-2026-0003', 'Stark Industries', 'finance@stark.com', 50000.00, 9000.00, 59000.00, 'overdue', '2026-08-10', NOW());

INSERT INTO m11_payments (id, tenant_id, invoice_id, amount, payment_method_id, bank_account_id, status, transaction_id, notes, created_at) VALUES
('pay_001', 'tenant_demo', 'inv_001', 11800.00, 'pm_003', 'ba_001', 'completed', 'UPI123456789', 'Full payment via UPI', NOW()),
('pay_002', 'tenant_demo', 'inv_002', 10000.00, 'pm_002', 'ba_001', 'completed', 'NEFT987654321', 'Partial payment', NOW());

-- ───────────────────────────────────────────────
-- M12 HR SEED DATA
-- ───────────────────────────────────────────────

INSERT INTO m12_departments (id, tenant_id, name, code, description, created_at) VALUES
('dept_001', 'tenant_demo', 'Engineering', 'ENG', 'Software development team', NOW()),
('dept_002', 'tenant_demo', 'Sales', 'SAL', 'Sales and business development', NOW()),
('dept_003', 'tenant_demo', 'Finance', 'FIN', 'Accounting and finance operations', NOW()),
('dept_004', 'tenant_demo', 'Human Resources', 'HR', 'HR and admin operations', NOW());

INSERT INTO m12_employees (id, tenant_id, employee_code, first_name, last_name, email, phone, department_id, designation, joining_date, salary, status, created_at) VALUES
('emp_001', 'tenant_demo', 'E001', 'Rahul', 'Sharma', 'rahul.s@gnt.local', '9876543210', 'dept_001', 'Senior Developer', '2024-01-15', 75000.00, 'active', NOW()),
('emp_002', 'tenant_demo', 'E002', 'Priya', 'Patel', 'priya.p@gnt.local', '9876543211', 'dept_001', 'Junior Developer', '2025-03-01', 45000.00, 'active', NOW()),
('emp_003', 'tenant_demo', 'E003', 'Amit', 'Kumar', 'amit.k@gnt.local', '9876543212', 'dept_002', 'Sales Manager', '2023-06-20', 90000.00, 'active', NOW()),
('emp_004', 'tenant_demo', 'E004', 'Sneha', 'Gupta', 'sneha.g@gnt.local', '9876543213', 'dept_003', 'Accountant', '2024-08-10', 55000.00, 'active', NOW()),
('emp_005', 'tenant_demo', 'E005', 'Vikram', 'Singh', 'vikram.s@gnt.local', '9876543214', 'dept_004', 'HR Executive', '2025-01-05', 50000.00, 'active', NOW());

INSERT INTO m12_attendance (id, tenant_id, employee_id, date, check_in, check_out, status, work_hours, overtime_hours, created_at) VALUES
('att_001', 'tenant_demo', 'emp_001', '2026-08-22', '09:00:00', '18:00:00', 'present', 8.0, 0.0, NOW()),
('att_002', 'tenant_demo', 'emp_002', '2026-08-22', '09:30:00', '18:30:00', 'present', 8.0, 0.5, NOW()),
('att_003', 'tenant_demo', 'emp_003', '2026-08-22', NULL, NULL, 'absent', 0.0, 0.0, NOW());

INSERT INTO m12_leave_requests (id, tenant_id, employee_id, leave_type, start_date, end_date, days, reason, status, approved_by, created_at) VALUES
('leave_001', 'tenant_demo', 'emp_001', 'sick', '2026-08-25', '2026-08-26', 2, 'Fever and cold', 'approved', 'emp_005', NOW()),
('leave_002', 'tenant_demo', 'emp_003', 'casual', '2026-08-28', '2026-08-30', 3, 'Family function', 'pending', NULL, NOW());

-- ───────────────────────────────────────────────
-- M13 AUTOMATION SEED DATA
-- ───────────────────────────────────────────────

INSERT INTO m13_workflows (id, tenant_id, name, description, trigger_config, actions, status, is_active, created_at) VALUES
('wf_001', 'tenant_demo', 'Payment Reminder', 'Send reminder 3 days before due date',
 '{"type": "schedule", "cron": "0 9 * * *"}',
 '[{"type": "send_email", "template": "payment_reminder"}]',
 'active', true, NOW()),
('wf_002', 'tenant_demo', 'Stock Alert', 'Alert when inventory below threshold',
 '{"type": "event", "event": "inventory.low"}',
 '[{"type": "send_notification", "channel": "email"}]',
 'active', true, NOW());

INSERT INTO m13_schedules (id, tenant_id, name, cron_expression, task_type, payload, timezone, is_active, created_at) VALUES
('sch_001', 'tenant_demo', 'Daily Backup', '0 2 * * *', 'backup', '{"type": "full"}', 'Asia/Kolkata', true, NOW()),
('sch_002', 'tenant_demo', 'Weekly Report', '0 9 * * MON', 'report', '{"type": "sales_summary"}', 'Asia/Kolkata', true, NOW());

INSERT INTO m13_triggers (id, tenant_id, name, type, entity, condition, is_active, created_at) VALUES
('trig_001', 'tenant_demo', 'Invoice Overdue Alert', 'event', 'invoice', '{"status": "overdue"}', true, NOW()),
('trig_002', 'tenant_demo', 'New Employee Welcome', 'event', 'employee', '{"status": "onboarded"}', true, NOW());

-- ───────────────────────────────────────────────
-- M14 IMPORT/EXPORT SEED DATA
-- ───────────────────────────────────────────────

INSERT INTO m14_import_jobs (id, tenant_id, file_name, file_type, entity_type, status, records_total, records_processed, records_failed, error_log, created_at) VALUES
('imp_001', 'tenant_demo', 'employees_july.csv', 'csv', 'employee', 'completed', 50, 48, 2, '[{"row": 12, "error": "Invalid email"}]', NOW()),
('imp_002', 'tenant_demo', 'payments_aug.xlsx', 'excel', 'payment', 'completed', 200, 200, 0, '[]', NOW());

INSERT INTO m14_export_templates (id, tenant_id, name, entity_type, format, fields, filters, created_at) VALUES
('tpl_001', 'tenant_demo', 'Employee Directory', 'employee', 'excel',
 '["employee_code", "first_name", "last_name", "email", "department", "designation"]',
 '{"status": "active"}', NOW()),
('tpl_002', 'tenant_demo', 'Payment Report', 'payment', 'csv',
 '["id", "amount", "payment_method", "status", "created_at"]',
 '{"status": "completed"}', NOW());

-- ───────────────────────────────────────────────
-- M15 SYNC SEED DATA
-- ───────────────────────────────────────────────

INSERT INTO m15_sync_jobs (id, tenant_id, name, description, source, target, sync_type, status, cron_expression, config, is_active, created_at) VALUES
('sync_001', 'tenant_demo', 'Daily Cloud Sync', 'Sync all data to cloud backup', 'local', 'cloud', 'delta', 'idle', '0 3 * * *',
 '{"tables": ["invoices", "payments", "employees"], "batchSize": 100}', true, NOW()),
('sync_002', 'tenant_demo', 'Hourly Payment Sync', 'Sync payments to external gateway', 'local', 'external_api', 'delta', 'idle', '0 * * * *',
 '{"tables": ["payments"], "batchSize": 50}', true, NOW());

INSERT INTO m15_backup_jobs (id, tenant_id, name, backup_type, status, storage_type, tables_included, retention_days, created_at) VALUES
('bak_001', 'tenant_demo', 'Full Backup Aug 2026', 'full', 'completed', 's3',
 '["invoices", "payments", "employees", "attendance"]', 30, NOW());

INSERT INTO m15_webhook_endpoints (id, tenant_id, name, url, secret, events, is_active, created_at) VALUES
('wh_001', 'tenant_demo', 'Slack Notifications', 'https://hooks.slack.com/services/xxx',
 'whsec_1234567890abcdef', '["sync.completed", "backup.failed", "conflict.created"]', true, NOW());
