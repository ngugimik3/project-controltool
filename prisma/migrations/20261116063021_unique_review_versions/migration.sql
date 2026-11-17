/*
  Warnings:

  - A unique constraint covering the columns `[checkItemId,version]` on the table `check_item_reviews` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,slot]` on the table `handover_docs` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[projectId,key,version]` on the table `stage_reviews` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "check_item_reviews_checkItemId_idx";

-- DropIndex
DROP INDEX "handover_docs_projectId_idx";

-- DropIndex
DROP INDEX "stage_reviews_projectId_key_idx";

-- CreateIndex
CREATE UNIQUE INDEX "check_item_reviews_checkItemId_version_key" ON "check_item_reviews"("checkItemId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "handover_docs_projectId_slot_key" ON "handover_docs"("projectId", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "stage_reviews_projectId_key_version_key" ON "stage_reviews"("projectId", "key", "version");
