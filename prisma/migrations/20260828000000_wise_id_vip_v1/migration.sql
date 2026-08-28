-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "MembershipTier" AS ENUM ('MEMBER', 'VIP', 'VIP_PLUS');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('BROKERAGE', 'EXCHANGE', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationMode" AS ENUM ('MANUAL', 'IMPORTED_RECORD', 'PARTNER_REPORT', 'API');

-- CreateEnum
CREATE TYPE "PartnerAccountStatus" AS ENUM ('NOT_CONNECTED', 'PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "QualificationMetricType" AS ENUM ('TRADING_VOLUME', 'DEPOSIT_AMOUNT', 'ACCOUNT_AGE_DAYS', 'MANUAL_SCORE');

-- CreateEnum
CREATE TYPE "QualificationMetricSource" AS ENUM ('ADMIN', 'IMPORT', 'PARTNER_API', 'USER_SUBMITTED');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_CREATED', 'PARTNER_ACCOUNT_SUBMITTED', 'PARTNER_ACCOUNT_APPROVED', 'PARTNER_ACCOUNT_REJECTED', 'PARTNER_ACCOUNT_NEEDS_REVIEW', 'MEMBERSHIP_UPGRADED', 'MEMBERSHIP_DOWNGRADED', 'ENTITLEMENT_GRANTED', 'ENTITLEMENT_REVOKED', 'PARTNER_CREATED', 'PARTNER_UPDATED', 'SSO_CLIENT_CREATED', 'SSO_CLIENT_UPDATED');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "wise_user_id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "email_verified" TIMESTAMP(3),
    "image" TEXT,
    "membership_tier" "MembershipTier" NOT NULL DEFAULT 'MEMBER',
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "auth_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "auth_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "email_otps" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partners" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL,
    "logo_url" TEXT,
    "referral_url" TEXT,
    "referral_code" TEXT,
    "vip_eligible" BOOLEAN NOT NULL DEFAULT false,
    "vip_plus_eligible" BOOLEAN NOT NULL DEFAULT false,
    "vip_plus_volume_threshold" DECIMAL(20,2),
    "verification_mode" "VerificationMode" NOT NULL DEFAULT 'MANUAL',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partners_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "external_identifier" TEXT NOT NULL,
    "status" "PartnerAccountStatus" NOT NULL DEFAULT 'PENDING',
    "user_note" TEXT,
    "review_note" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_at" TIMESTAMP(3),
    "verified_by_id" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qualification_metrics" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "partner_account_id" TEXT NOT NULL,
    "metric_type" "QualificationMetricType" NOT NULL,
    "value" DECIMAL(20,2) NOT NULL,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "source" "QualificationMetricSource" NOT NULL DEFAULT 'ADMIN',
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qualification_metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entitlements" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "starts_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "entitlements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actor_user_id" TEXT,
    "target_user_id" TEXT,
    "action" "AuditAction" NOT NULL,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sso_clients" (
    "id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowed_redirect_uris" TEXT[],
    "allowed_scopes" TEXT[],
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_by_id" TEXT,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sso_clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wise_user_id_key" ON "users"("wise_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "auth_accounts_user_id_idx" ON "auth_accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_accounts_provider_provider_account_id_key" ON "auth_accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_sessions_session_token_key" ON "auth_sessions"("session_token");

-- CreateIndex
CREATE INDEX "auth_sessions_user_id_idx" ON "auth_sessions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_token_key" ON "auth_verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "auth_verification_tokens_identifier_token_key" ON "auth_verification_tokens"("identifier", "token");

-- CreateIndex
CREATE INDEX "email_otps_email_created_at_idx" ON "email_otps"("email", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "partners_slug_key" ON "partners"("slug");

-- CreateIndex
CREATE INDEX "partners_type_enabled_idx" ON "partners"("type", "enabled");

-- CreateIndex
CREATE INDEX "partner_accounts_partner_id_status_idx" ON "partner_accounts"("partner_id", "status");

-- CreateIndex
CREATE INDEX "partner_accounts_user_id_status_idx" ON "partner_accounts"("user_id", "status");

-- CreateIndex
CREATE INDEX "partner_accounts_verified_by_id_idx" ON "partner_accounts"("verified_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "partner_accounts_user_id_partner_id_external_identifier_key" ON "partner_accounts"("user_id", "partner_id", "external_identifier");

-- CreateIndex
CREATE INDEX "qualification_metrics_user_id_metric_type_idx" ON "qualification_metrics"("user_id", "metric_type");

-- CreateIndex
CREATE INDEX "qualification_metrics_partner_account_id_metric_type_idx" ON "qualification_metrics"("partner_account_id", "metric_type");

-- CreateIndex
CREATE UNIQUE INDEX "entitlements_user_id_key_key" ON "entitlements"("user_id", "key");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_target_user_id_idx" ON "audit_logs"("target_user_id");

-- CreateIndex
CREATE INDEX "audit_logs_action_created_at_idx" ON "audit_logs"("action", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "sso_clients_client_id_key" ON "sso_clients"("client_id");

-- CreateIndex
CREATE INDEX "sso_clients_enabled_idx" ON "sso_clients"("enabled");

-- AddForeignKey
ALTER TABLE "auth_accounts" ADD CONSTRAINT "auth_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auth_sessions" ADD CONSTRAINT "auth_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accounts" ADD CONSTRAINT "partner_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accounts" ADD CONSTRAINT "partner_accounts_partner_id_fkey" FOREIGN KEY ("partner_id") REFERENCES "partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_accounts" ADD CONSTRAINT "partner_accounts_verified_by_id_fkey" FOREIGN KEY ("verified_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualification_metrics" ADD CONSTRAINT "qualification_metrics_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qualification_metrics" ADD CONSTRAINT "qualification_metrics_partner_account_id_fkey" FOREIGN KEY ("partner_account_id") REFERENCES "partner_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entitlements" ADD CONSTRAINT "entitlements_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_target_user_id_fkey" FOREIGN KEY ("target_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sso_clients" ADD CONSTRAINT "sso_clients_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sso_clients" ADD CONSTRAINT "sso_clients_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
