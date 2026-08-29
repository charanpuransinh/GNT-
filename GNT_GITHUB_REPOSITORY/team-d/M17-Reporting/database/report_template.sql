-- report_template table | Owner: M17 Reporting
CREATE TABLE IF NOT EXISTS report_template (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100) NOT NULL CHECK (template_type IN (
    'pdf','excel','html','csv'
  )),
  layout_json JSONB NOT NULL DEFAULT '{}',
  header_html TEXT,
  footer_html TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_report_template_company ON report_template(company_id);
CREATE INDEX idx_report_template_type ON report_template(template_type);
