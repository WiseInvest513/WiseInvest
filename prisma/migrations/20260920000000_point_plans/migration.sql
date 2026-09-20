CREATE TYPE "PointPlanStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'WITHDRAWN', 'CLOSED');
CREATE TYPE "PointRevisionAction" AS ENUM ('CREATED', 'UPDATED', 'PUBLISHED', 'WITHDRAWN', 'CLOSED');

CREATE TABLE "point_plans" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "PointPlanStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "snapshot" JSONB NOT NULL,
    "published_at" TIMESTAMP(3),
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "point_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "point_plans_version_positive" CHECK ("version" > 0),
    CONSTRAINT "point_plans_valid_window" CHECK ("valid_from" < "valid_until")
);

CREATE TABLE "point_revisions" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "action" "PointRevisionAction" NOT NULL,
    "reason" TEXT NOT NULL,
    "actor_user_id" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "point_revisions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "point_revisions_version_positive" CHECK ("version" > 0),
    CONSTRAINT "point_revisions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "point_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "point_plans_status_published_at_idx" ON "point_plans"("status", "published_at");
CREATE INDEX "point_plans_symbol_published_at_idx" ON "point_plans"("symbol", "published_at");
CREATE INDEX "point_plans_category_status_valid_until_idx" ON "point_plans"("category", "status", "valid_until");
CREATE UNIQUE INDEX "point_revisions_plan_id_version_key" ON "point_revisions"("plan_id", "version");
CREATE INDEX "point_revisions_plan_id_created_at_idx" ON "point_revisions"("plan_id", "created_at");
CREATE INDEX "point_revisions_actor_user_id_created_at_idx" ON "point_revisions"("actor_user_id", "created_at");

-- Enforce append-only audit history below the application layer as well.
CREATE FUNCTION "point_revisions_append_only"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Point revisions are append-only';
END;
$$;
CREATE TRIGGER "point_revisions_no_update_or_delete"
BEFORE UPDATE OR DELETE ON "point_revisions"
FOR EACH ROW EXECUTE FUNCTION "point_revisions_append_only"();
