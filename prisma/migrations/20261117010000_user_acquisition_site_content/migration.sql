ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "acquisition_site" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "acquisition_content" TEXT;
CREATE INDEX IF NOT EXISTS "users_acquisition_site_idx" ON "users"("acquisition_site");
