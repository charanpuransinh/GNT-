-- notification_delivery_log table | Owner: M16 Notification Engine
CREATE TABLE IF NOT EXISTS notification_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES notification_master(id) ON DELETE CASCADE,
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('in_app','whatsapp','sms','email')),
  status VARCHAR(15) NOT NULL CHECK (status IN ('sent','delivered','failed')),
  provider_response TEXT,
  attempted_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  error_message TEXT
);

CREATE INDEX idx_notification_delivery_log_notification ON notification_delivery_log(notification_id);
CREATE INDEX idx_notification_delivery_log_channel_status ON notification_delivery_log(channel, status);
