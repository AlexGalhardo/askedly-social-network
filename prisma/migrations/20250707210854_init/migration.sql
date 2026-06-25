-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "is_seed" BOOLEAN NOT NULL DEFAULT false,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "description" TEXT,
    "website" TEXT,
    "public_questions_remaining_today" INTEGER NOT NULL DEFAULT 10,
    "anonymous_questions_remaining_today" INTEGER NOT NULL DEFAULT 1,
    "pix_key" TEXT,
    "avatar_url" TEXT,
    "twitter" TEXT,
    "instagram" TEXT,
    "youtube" TEXT,
    "tiktok" TEXT,
    "linkedin" TEXT,
    "twitch" TEXT,
    "facebook" TEXT,
    "github" TEXT,
    "reset_password_token" TEXT,
    "reset_password_token_expires_at" TIMESTAMP(3),
    "confirm_email_token" TEXT,
    "confirm_email_token_expires_at" TIMESTAMP(3),
    "confirmed_email" BOOLEAN NOT NULL DEFAULT false,
    "api_key" TEXT NOT NULL,
    "privacy_is_private_profile" BOOLEAN NOT NULL DEFAULT false,
    "privacy_accept_anonymous_questions" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_anonymous_questions_public" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_questions_answered_only_to_followers" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_value_received_from_answering_question" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_date_questions_was_answered" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_total_following_public" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_total_followers_public" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_total_questions_sent_public" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_likes_each_answer_public" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_dislikes_each_answer_public" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_total_likes_all_answers_public" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_total_questions_received_public" BOOLEAN NOT NULL DEFAULT false,
    "privacy_show_total_questions_answered_public" BOOLEAN NOT NULL DEFAULT false,
    "banned_first_time" BOOLEAN NOT NULL DEFAULT false,
    "banned_second_time" BOOLEAN NOT NULL DEFAULT false,
    "banned_reason" TEXT,
    "banned_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3),
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_blocks" (
    "id" TEXT NOT NULL,
    "blocker_id" TEXT NOT NULL,
    "blocked_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "followers" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "followers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_requests" (
    "id" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "follow_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "is_seed" BOOLEAN NOT NULL DEFAULT false,
    "question_text" TEXT NOT NULL,
    "answer_text" TEXT,
    "answered_at" TIMESTAMP(3),
    "amount_paid" INTEGER NOT NULL,
    "amount_already_withdraw" BOOLEAN NOT NULL DEFAULT false,
    "asker_want_answer_to_be_private" BOOLEAN NOT NULL DEFAULT false,
    "asker_sent_anonymous_question" BOOLEAN NOT NULL DEFAULT false,
    "amount_paid_is_private" BOOLEAN NOT NULL DEFAULT false,
    "onwer_wants_amount_paid_not_show_public" BOOLEAN NOT NULL DEFAULT false,
    "owner_user_nickname" TEXT NOT NULL,
    "asked_by_user_nickname" TEXT NOT NULL,
    "question_is_awaiting_answer" BOOLEAN NOT NULL DEFAULT true,
    "question_answered" BOOLEAN NOT NULL DEFAULT false,
    "question_answer_was_recused" BOOLEAN NOT NULL DEFAULT false,
    "question_answer_was_expired" BOOLEAN NOT NULL DEFAULT false,
    "question_answer_recused_at" TIMESTAMP(3),
    "question_answer_expired_at" TIMESTAMP(3),
    "liked_by_users" TEXT,
    "desliked_by_users" TEXT,
    "owner_reported_offensive_question" BOOLEAN NOT NULL DEFAULT false,
    "onwer_reported_inadequate_question" BOOLEAN NOT NULL DEFAULT false,
    "onwer_reported_question_at" TIMESTAMP(3),
    "asker_reported_answer" BOOLEAN NOT NULL DEFAULT false,
    "asker_reported_answer_reason" TEXT,
    "asker_reported_answer_at" TIMESTAMP(3),
    "payment_withdraw_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),
    "webhook_id" TEXT NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_withdraws" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "user_nickname" TEXT NOT NULL,
    "send_to_pix_key" TEXT NOT NULL,
    "amount_withdraw" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_withdraws_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks_abacatepay" (
    "id" TEXT NOT NULL,
    "is_seed" BOOLEAN NOT NULL DEFAULT false,
    "pix_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "fee" INTEGER NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'PIX',
    "kind" TEXT NOT NULL,
    "event_status" TEXT NOT NULL,
    "dev_mode" BOOLEAN NOT NULL,
    "complete_event" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "webhooks_abacatepay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "deleted_accounts" (
    "id" TEXT NOT NULL,
    "is_seed" BOOLEAN NOT NULL DEFAULT false,
    "user_id_was" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "account_was_created_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deleted_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_nickname_key" ON "users"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_pix_key_key" ON "users"("pix_key");

-- CreateIndex
CREATE UNIQUE INDEX "users_avatar_url_key" ON "users"("avatar_url");

-- CreateIndex
CREATE UNIQUE INDEX "users_api_key_key" ON "users"("api_key");

-- CreateIndex
CREATE UNIQUE INDEX "user_blocks_blocker_id_blocked_id_key" ON "user_blocks"("blocker_id", "blocked_id");

-- CreateIndex
CREATE UNIQUE INDEX "followers_followerId_followingId_key" ON "followers"("followerId", "followingId");

-- CreateIndex
CREATE UNIQUE INDEX "follow_requests_senderId_receiverId_key" ON "follow_requests"("senderId", "receiverId");

-- CreateIndex
CREATE UNIQUE INDEX "questions_webhook_id_key" ON "questions"("webhook_id");

-- CreateIndex
CREATE UNIQUE INDEX "webhooks_abacatepay_pix_id_key" ON "webhooks_abacatepay"("pix_id");

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_blocks" ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "followers" ADD CONSTRAINT "followers_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_requests" ADD CONSTRAINT "follow_requests_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_requests" ADD CONSTRAINT "follow_requests_receiverId_fkey" FOREIGN KEY ("receiverId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_webhook_id_fkey" FOREIGN KEY ("webhook_id") REFERENCES "webhooks_abacatepay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_owner_user_nickname_fkey" FOREIGN KEY ("owner_user_nickname") REFERENCES "users"("nickname") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_asked_by_user_nickname_fkey" FOREIGN KEY ("asked_by_user_nickname") REFERENCES "users"("nickname") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_payment_withdraw_id_fkey" FOREIGN KEY ("payment_withdraw_id") REFERENCES "payment_withdraws"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_withdraws" ADD CONSTRAINT "payment_withdraws_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
