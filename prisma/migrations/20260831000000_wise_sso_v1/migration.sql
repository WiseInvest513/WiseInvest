ALTER TABLE "sso_clients"
ADD COLUMN "client_secret_hash" TEXT,
ADD COLUMN "require_pkce" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "sso_authorization_codes" (
    "id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "redirect_uri" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "code_challenge" TEXT,
    "code_challenge_method" TEXT,
    "nonce" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "consumed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sso_authorization_codes_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "sso_authorization_codes_code_hash_key" ON "sso_authorization_codes"("code_hash");
CREATE INDEX "sso_authorization_codes_client_id_expires_at_idx" ON "sso_authorization_codes"("client_id", "expires_at");
CREATE INDEX "sso_authorization_codes_user_id_created_at_idx" ON "sso_authorization_codes"("user_id", "created_at");

ALTER TABLE "sso_authorization_codes"
ADD CONSTRAINT "sso_authorization_codes_client_id_fkey"
FOREIGN KEY ("client_id") REFERENCES "sso_clients"("client_id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sso_authorization_codes"
ADD CONSTRAINT "sso_authorization_codes_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
