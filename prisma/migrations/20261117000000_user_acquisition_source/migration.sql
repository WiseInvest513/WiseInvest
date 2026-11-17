ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "acquisition_source" TEXT;
CREATE INDEX IF NOT EXISTS "users_acquisition_source_idx" ON "users"("acquisition_source");
