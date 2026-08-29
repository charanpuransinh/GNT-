-- M02 Core Architecture Migration
-- Version: 1.0.0
-- Created: 2026-08-23
-- Team: A4-APPLE

BEGIN;

-- Create tables
\i schema.sql

-- Insert default permissions for all modules
INSERT INTO permission_master (module, action, resource, description) VALUES
-- M01 Foundation
('M01', 'read', 'config', 'Read app configuration'),
('M01', 'read', 'health', 'Read health status'),

-- M02 Core (self)
('M02', 'create', 'user', 'Create users'),
('M02', 'read', 'user', 'Read users'),
('M02', 'update', 'user', 'Update users'),
('M02', 'delete', 'user', 'Delete users'),
('M02', 'create', 'role', 'Create roles'),
('M02', 'read', 'role', 'Read roles'),
('M02', 'update', 'role', 'Update roles'),
('M02', 'delete', 'role', 'Delete roles'),

-- M04 Company
('M04', 'read', 'company', 'Read company info'),
('M04', 'update', 'company', 'Update company info'),

-- M05 Party
('M05', 'create', 'party', 'Create party'),
('M05', 'read', 'party', 'Read party'),
('M05', 'update', 'party', 'Update party'),
('M05', 'delete', 'party', 'Delete party'),

-- M06 Inventory
('M06', 'create', 'product', 'Create product'),
('M06', 'read', 'product', 'Read product'),
('M06', 'update', 'product', 'Update product'),
('M06', 'delete', 'product', 'Delete product'),

-- M07 Purchase
('M07', 'create', 'purchase', 'Create purchase'),
('M07', 'read', 'purchase', 'Read purchase'),
('M07', 'update', 'purchase', 'Update purchase'),
('M07', 'delete', 'purchase', 'Delete purchase'),

-- M08 Sales
('M08', 'create', 'sales', 'Create sales invoice'),
('M08', 'read', 'sales', 'Read sales invoice'),
('M08', 'update', 'sales', 'Update sales invoice'),
('M08', 'delete', 'sales', 'Delete sales invoice'),

-- M09 GST
('M09', 'read', 'gst', 'Read GST data'),
('M09', 'update', 'gst', 'Update GST config'),

-- M10 Accounting
('M10', 'create', 'voucher', 'Create voucher'),
('M10', 'read', 'ledger', 'Read ledger'),

-- M11 Payment
('M11', 'create', 'payment', 'Create payment'),
('M11', 'read', 'payment', 'Read payment'),

-- M12 HR
('M12', 'create', 'employee', 'Create employee'),
('M12', 'read', 'employee', 'Read employee'),

-- M13 Automation
('M13', 'read', 'automation', 'Read automation rules'),
('M13', 'update', 'automation', 'Update automation rules'),

-- M14 Import/Export
('M14', 'create', 'import', 'Import data'),
('M14', 'create', 'export', 'Export data'),

-- M15 Sync
('M15', 'read', 'sync', 'Read sync status'),
('M15', 'update', 'sync', 'Trigger sync'),

-- M16 Notification
('M16', 'read', 'notification', 'Read notifications'),
('M16', 'create', 'notification', 'Send notification'),

-- M17 Reporting
('M17', 'read', 'report', 'Generate reports'),

-- M18 Integration
('M18', 'read', 'integration', 'Read integration status'),
('M18', 'update', 'integration', 'Update integration config'),

-- M19 Monitoring
('M19', 'read', 'audit', 'Read audit logs'),
('M19', 'read', 'security', 'Read security events'),

-- M20 International Trade
('M20', 'create', 'trade', 'Create trade document'),
('M20', 'read', 'trade', 'Read trade document')
ON CONFLICT (module, action, resource) DO NOTHING;

COMMIT;
