-- report_config table | Owner: M17 Reporting
CREATE TABLE IF NOT EXISTS report_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL CHECK (report_type IN (
    'sales','purchase','inventory','gst','accounting','hr','executive'
  )),
  filters_json JSONB NOT NULL DEFAULT '{}',
  schedule JSONB,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_config_company ON report_config(company_id);
CREATE INDEX idx_report_config_type ON report_config(report_type);
CREATE INDEX idx_report_config_created_by ON report_config(created_by);
