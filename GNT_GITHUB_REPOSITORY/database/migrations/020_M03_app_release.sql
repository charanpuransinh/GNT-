-- GNT — M03: asli app-release table. Pehle device.internal.ts me hardcoded
-- LATEST_VERSIONS / RELEASE_NOTES the (nakli "2.1.0" callers ko jaata tha).
-- Ab /api/v1/device/update-check yahin se padhta hai; koi published release
-- na ho to hasUpdate:false (imaandaari se), nakli version nahi.

CREATE TABLE IF NOT EXISTS "m03_app_releases" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "platform"      VARCHAR(20) NOT NULL,
  "version"       VARCHAR(30) NOT NULL,
  "release_notes" TEXT[] NOT NULL DEFAULT '{}',
  "min_supported" VARCHAR(30),
  "download_url"  VARCHAR(500),
  "is_published"  BOOLEAN NOT NULL DEFAULT TRUE,
  "released_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "created_by"    UUID,
  "created_at"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "m03_app_releases_platform_version_key"
  ON "m03_app_releases" ("platform", "version");

CREATE INDEX IF NOT EXISTS "m03_app_releases_platform_published_released_idx"
  ON "m03_app_releases" ("platform", "is_published", "released_at");
