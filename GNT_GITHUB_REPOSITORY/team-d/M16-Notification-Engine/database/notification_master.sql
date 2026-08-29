-- notification_master table | Owner: M16 Notification Engine
CREATE TABLE IF NOT EXISTS notification_master (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('in_app','whatsapp','sms','email')),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN (
    'sales_invoice','purchase_invoice','payment','stock','gst_return','employee_salary','general'
  )),
  entity_id UUID,
  priority VARCHAR(10) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low','normal','high','urgent')),
  status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','delivered','failed','read')),
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notification_master_user ON notification_master(user_id, company_id);
CREATE INDEX idx_notification_master_status ON notification_master(status);
CREATE INDEX idx_notification_master_entity ON notification_master(entity_type, entity_id);
CREATE INDEX idx_notification_master_created ON notification_master(created_at DESC);
