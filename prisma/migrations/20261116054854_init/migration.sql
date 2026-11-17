-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "username" TEXT,
    "displayUsername" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "client" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "contract" DOUBLE PRECISION NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "specDim" TEXT NOT NULL DEFAULT '',
    "specVolt" TEXT NOT NULL DEFAULT '',
    "specKw" TEXT NOT NULL DEFAULT '',
    "specStd" TEXT NOT NULL DEFAULT '',
    "specNotes" TEXT NOT NULL DEFAULT '',
    "signedBy" TEXT NOT NULL DEFAULT '',
    "signedAt" TIMESTAMP(3),
    "extra" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "text" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Unassigned',
    "owner" TEXT NOT NULL DEFAULT '',
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "dependsOnId" TEXT,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_orders" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "needBy" DATE NOT NULL,
    "promisedBy" DATE NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "waybill" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "reading" TEXT NOT NULL DEFAULT '',
    "result" TEXT NOT NULL DEFAULT '',
    "note" TEXT NOT NULL DEFAULT '',
    "status" INTEGER NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "check_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "check_item_reviews" (
    "id" TEXT NOT NULL,
    "checkItemId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "author" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "check_item_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stage_reviews" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "author" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "text" TEXT NOT NULL,

    CONSTRAINT "stage_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handover_docs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "slot" TEXT NOT NULL,
    "ref" TEXT NOT NULL DEFAULT '',
    "ready" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "handover_docs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cost_lines" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "budget" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "actual" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "cost_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "params" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "groupName" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL DEFAULT '',
    "unit" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "params_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_visits" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" TEXT NOT NULL,
    "who" TEXT NOT NULL DEFAULT '',
    "purpose" TEXT NOT NULL DEFAULT '',
    "notes" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'Planned',

    CONSTRAINT "site_visits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attachments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "checkItemId" TEXT,
    "name" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "isImage" BOOLEAN NOT NULL DEFAULT false,
    "data" BYTEA NOT NULL,
    "uploadedBy" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "activity_log" (
    "id" SERIAL NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,

    CONSTRAINT "activity_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "session"("token");

-- CreateIndex
CREATE INDEX "session_userId_idx" ON "session"("userId");

-- CreateIndex
CREATE INDEX "account_userId_idx" ON "account"("userId");

-- CreateIndex
CREATE INDEX "verification_identifier_idx" ON "verification"("identifier");

-- CreateIndex
CREATE INDEX "projects_stage_idx" ON "projects"("stage");

-- CreateIndex
CREATE UNIQUE INDEX "notes_projectId_key_key" ON "notes"("projectId", "key");

-- CreateIndex
CREATE INDEX "tasks_projectId_idx" ON "tasks"("projectId");

-- CreateIndex
CREATE INDEX "purchase_orders_projectId_idx" ON "purchase_orders"("projectId");

-- CreateIndex
CREATE INDEX "check_items_projectId_kind_idx" ON "check_items"("projectId", "kind");

-- CreateIndex
CREATE INDEX "check_item_reviews_checkItemId_idx" ON "check_item_reviews"("checkItemId");

-- CreateIndex
CREATE INDEX "stage_reviews_projectId_key_idx" ON "stage_reviews"("projectId", "key");

-- CreateIndex
CREATE INDEX "handover_docs_projectId_idx" ON "handover_docs"("projectId");

-- CreateIndex
CREATE INDEX "cost_lines_projectId_idx" ON "cost_lines"("projectId");

-- CreateIndex
CREATE INDEX "params_projectId_idx" ON "params"("projectId");

-- CreateIndex
CREATE INDEX "site_visits_projectId_idx" ON "site_visits"("projectId");

-- CreateIndex
CREATE INDEX "attachments_projectId_scope_idx" ON "attachments"("projectId", "scope");

-- CreateIndex
CREATE INDEX "activity_log_ts_idx" ON "activity_log"("ts");

-- AddForeignKey
ALTER TABLE "session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "tasks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_items" ADD CONSTRAINT "check_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "check_item_reviews" ADD CONSTRAINT "check_item_reviews_checkItemId_fkey" FOREIGN KEY ("checkItemId") REFERENCES "check_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stage_reviews" ADD CONSTRAINT "stage_reviews_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handover_docs" ADD CONSTRAINT "handover_docs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cost_lines" ADD CONSTRAINT "cost_lines_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "params" ADD CONSTRAINT "params_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_visits" ADD CONSTRAINT "site_visits_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_checkItemId_fkey" FOREIGN KEY ("checkItemId") REFERENCES "check_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
