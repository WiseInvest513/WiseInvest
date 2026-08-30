-- CreateEnum
CREATE TYPE "ContentItemType" AS ENUM ('ARTICLE', 'ROADMAP_DETAIL', 'ROADMAP_ROUTE');

-- CreateEnum
CREATE TYPE "ContentAccessLevel" AS ENUM ('PUBLIC', 'MEMBER', 'VIP', 'VIP_PLUS');

-- CreateEnum
CREATE TYPE "ContentEventType" AS ENUM ('VIEW', 'PREVIEW_LOCKED', 'LOGIN_PROMPT', 'FAVORITE_ADD', 'FAVORITE_REMOVE');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'CONTENT_PERMISSION_UPDATED';

-- CreateTable
CREATE TABLE "content_permissions" (
    "id" TEXT NOT NULL,
    "content_type" "ContentItemType" NOT NULL,
    "content_key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "access" "ContentAccessLevel" NOT NULL DEFAULT 'MEMBER',
    "reason" TEXT NOT NULL,
    "updated_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event_type" "ContentEventType" NOT NULL,
    "content_type" "ContentItemType" NOT NULL,
    "content_key" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "title" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_content_items" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_type" "ContentItemType" NOT NULL,
    "content_key" TEXT NOT NULL,
    "href" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "last_viewed_at" TIMESTAMP(3),
    "favorited_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_content_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "content_permissions_content_type_content_key_key" ON "content_permissions"("content_type", "content_key");

-- CreateIndex
CREATE INDEX "content_permissions_access_idx" ON "content_permissions"("access");

-- CreateIndex
CREATE INDEX "content_permissions_updated_by_id_idx" ON "content_permissions"("updated_by_id");

-- CreateIndex
CREATE INDEX "content_events_user_id_created_at_idx" ON "content_events"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "content_events_event_type_created_at_idx" ON "content_events"("event_type", "created_at");

-- CreateIndex
CREATE INDEX "content_events_content_type_content_key_idx" ON "content_events"("content_type", "content_key");

-- CreateIndex
CREATE UNIQUE INDEX "user_content_items_user_id_content_type_content_key_key" ON "user_content_items"("user_id", "content_type", "content_key");

-- CreateIndex
CREATE INDEX "user_content_items_user_id_last_viewed_at_idx" ON "user_content_items"("user_id", "last_viewed_at");

-- CreateIndex
CREATE INDEX "user_content_items_user_id_favorited_at_idx" ON "user_content_items"("user_id", "favorited_at");

-- AddForeignKey
ALTER TABLE "content_permissions" ADD CONSTRAINT "content_permissions_updated_by_id_fkey" FOREIGN KEY ("updated_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_events" ADD CONSTRAINT "content_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_content_items" ADD CONSTRAINT "user_content_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
