/*
  Warnings:

  - You are about to drop the column `selectedOptions` on the `quote_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "product_optionals" ADD COLUMN     "selected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "products" ALTER COLUMN "price" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "quote_items" DROP COLUMN "selectedOptions";

-- AlterTable
ALTER TABLE "service_options" ADD COLUMN     "selected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "services" ALTER COLUMN "price" SET DEFAULT 0;
