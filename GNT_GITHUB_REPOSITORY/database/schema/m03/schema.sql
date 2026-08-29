-- M03 DEVICE & PLATFORM — Database Schema
-- Owner: A4-APPLE Team
-- Tables: device_registry, active_session, deployment_settings

-- device_registry: Registered devices per user
CREATE TABLE IF NOT EXISTS device_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_master(id) ON DELETE CASCADE,
    device_name VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'windows', 'macos', 'linux', 'web')),
    os_version VARCHAR(50) NOT NULL,
    app_version VARCHAR(20) NOT NULL,
    push_token VARCHAR(255),
    is_trusted BOOLEAN DEFAULT false,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, device_name)
);

CREATE INDEX idx_device_registry_user ON device_registry(user_id);
CREATE INDEX idx_device_registry_platform ON device_registry(platform);

-- active_session: Current login sessions
CREATE TABLE IF NOT EXISTS active_session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES user_master(id) ON DELETE CASCADE,
    device_id UUID REFERENCES device_registry(id) ON DELETE SET NULL,
    device_name VARCHAR(100),
    platform VARCHAR(20),
    ip_address INET NOT NULL,
    location VARCHAR(100),
    user_agent TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'idle', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_active_session_user ON active_session(user_id);
CREATE INDEX idx_active_session_expires ON active_session(expires_at);
CREATE INDEX idx_active_session_status ON active_session(status) WHERE status = 'active';

-- deployment_settings: Per-company deployment configuration
CREATE TABLE IF NOT EXISTS deployment_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES company_master(id) ON DELETE CASCADE,
    auto_update BOOLEAN DEFAULT false,
    update_notifications BOOLEAN DEFAULT true,
    session_timeout INTEGER NOT NULL DEFAULT 30 CHECK (session_timeout BETWEEN 5 AND 120),
    force_single_session BOOLEAN DEFAULT false,
    offline_sync BOOLEAN DEFAULT true,
    sync_interval INTEGER NOT NULL DEFAULT 15 CHECK (sync_interval BETWEEN 1 AND 60),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(company_id)
);

CREATE INDEX idx_deployment_settings_company ON deployment_settings(company_id);
