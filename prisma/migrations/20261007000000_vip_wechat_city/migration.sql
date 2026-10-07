ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "wechat_city" TEXT;
ALTER TABLE "vip_exchange_records" ADD COLUMN IF NOT EXISTS "wechat_city" TEXT;
UPDATE "vip_exchange_records" AS ver
SET "wechat_city" = u."wechat_city"
FROM "users" AS u
WHERE ver."user_id" = u."id"
  AND ver."wechat_city" IS NULL
  AND u."wechat_city" IS NOT NULL;
CREATE INDEX IF NOT EXISTS "vip_exchange_records_wechat_city_idx" ON "vip_exchange_records"("wechat_city");
