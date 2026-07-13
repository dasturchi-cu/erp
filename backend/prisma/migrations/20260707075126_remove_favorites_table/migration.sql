/*
  Warnings:

  - You are about to drop the `user_favorite_products` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "user_favorite_products" DROP CONSTRAINT "user_favorite_products_product_id_fkey";

-- DropForeignKey
ALTER TABLE "user_favorite_products" DROP CONSTRAINT "user_favorite_products_user_id_fkey";

-- DropTable
DROP TABLE "user_favorite_products";
