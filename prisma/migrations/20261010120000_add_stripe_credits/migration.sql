-- AlterTable
ALTER TABLE "users" ADD COLUMN     "credits_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stripe_account_id" TEXT;

-- AlterTable
ALTER TABLE "questions" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "stripe_transfer_id" TEXT,
ALTER COLUMN "webhook_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "stripe_purchases" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "checkout_session_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stripe_purchases_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_stripe_account_id_key" ON "users"("stripe_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "stripe_purchases_checkout_session_id_key" ON "stripe_purchases"("checkout_session_id");

-- AddForeignKey
ALTER TABLE "stripe_purchases" ADD CONSTRAINT "stripe_purchases_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
