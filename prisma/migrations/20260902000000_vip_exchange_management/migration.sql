-- CreateEnum
CREATE TYPE "VipExchangeRecordSource" AS ENUM ('VERIFIED_ACCOUNT', 'MANUAL');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'VIP_EXCHANGE_RECORD_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'VIP_EXCHANGE_RECORD_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'VIP_EXCHANGE_RECORD_DELETED';

-- CreateTable
CREATE TABLE "vip_exchange_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "partner_account_id" TEXT,
    "email" TEXT NOT NULL,
    "wechat_id" TEXT,
    "platform" TEXT NOT NULL,
    "uid" TEXT NOT NULL,
    "source" "VipExchangeRecordSource" NOT NULL DEFAULT 'MANUAL',
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vip_exchange_records_pkey" PRIMARY KEY ("id")
);

-- Backfill verified exchange accounts so the management list is complete on launch.
INSERT INTO "vip_exchange_records" (
    "id",
    "user_id",
    "partner_account_id",
    "email",
    "wechat_id",
    "platform",
    "uid",
    "source",
    "created_at",
    "updated_at"
)
SELECT
    'ver_' || pa."id",
    pa."user_id",
    pa."id",
    COALESCE(u."email", ''),
    u."wechat_id",
    p."name",
    pa."external_identifier",
    'VERIFIED_ACCOUNT'::"VipExchangeRecordSource",
    COALESCE(pa."verified_at", pa."submitted_at"),
    pa."updated_at"
FROM "partner_accounts" pa
INNER JOIN "partners" p ON p."id" = pa."partner_id"
INNER JOIN "users" u ON u."id" = pa."user_id"
WHERE pa."status" = 'VERIFIED'
  AND p."type" = 'EXCHANGE'
  AND p."vip_eligible" = true;

-- CreateIndex
CREATE UNIQUE INDEX "vip_exchange_records_partner_account_id_key" ON "vip_exchange_records"("partner_account_id");
CREATE INDEX "vip_exchange_records_platform_uid_idx" ON "vip_exchange_records"("platform", "uid");
CREATE INDEX "vip_exchange_records_email_idx" ON "vip_exchange_records"("email");
CREATE INDEX "vip_exchange_records_wechat_id_idx" ON "vip_exchange_records"("wechat_id");
CREATE INDEX "vip_exchange_records_platform_idx" ON "vip_exchange_records"("platform");
CREATE INDEX "vip_exchange_records_user_id_idx" ON "vip_exchange_records"("user_id");

-- AddForeignKey
ALTER TABLE "vip_exchange_records" ADD CONSTRAINT "vip_exchange_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vip_exchange_records" ADD CONSTRAINT "vip_exchange_records_partner_account_id_fkey" FOREIGN KEY ("partner_account_id") REFERENCES "partner_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
