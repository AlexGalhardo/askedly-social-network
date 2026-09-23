import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

export async function POST(req: NextRequest) {
	try {
		const session = await getServerSession(authOptions);

		if (!session || !session.user?.id) {
			return NextResponse.json({ error: "Usuário não autenticado" }, { status: 401 });
		}

		const body = await req.json();

		const {
			acceptAnonymousQuestions,
			showQuestionsAnonymousAnsweredPublic,
			showTotalQuestionsReceived,
			showTotalQuestionsAnswered,
			showTotalQuestionSent,
			showAnsweredToFollowersOnly,
			showPaymentAmountEachQuestion,
			showAnswerDate,
			showFollowersCount,
			showIndividualLikes,
			showIndividualDislikes,
			showTotalLikes,
		} = body;

		const booleanFields = [
			{ name: "acceptAnonymousQuestions", value: acceptAnonymousQuestions },
			{ name: "showQuestionsAnonymousAnsweredPublic", value: showQuestionsAnonymousAnsweredPublic },
			{ name: "showTotalQuestionsReceived", value: showTotalQuestionsReceived },
			{ name: "showTotalQuestionsAnswered", value: showTotalQuestionsAnswered },
			{ name: "showTotalQuestionSent", value: showTotalQuestionSent },
			{ name: "showAnsweredToFollowersOnly", value: showAnsweredToFollowersOnly },
			{ name: "showPaymentAmountEachQuestion", value: showPaymentAmountEachQuestion },
			{ name: "showAnswerDate", value: showAnswerDate },
			{ name: "showFollowersCount", value: showFollowersCount },
			{ name: "showIndividualLikes", value: showIndividualLikes },
			{ name: "showIndividualDislikes", value: showIndividualDislikes },
			{ name: "showTotalLikes", value: showTotalLikes },
		];

		for (const field of booleanFields) {
			if (typeof field.value !== "boolean") {
				return NextResponse.json(
					{ error: `Campo ${field.name} deve ser verdadeiro ou falso` },
					{ status: 400 },
				);
			}
		}

		if (!acceptAnonymousQuestions && showQuestionsAnonymousAnsweredPublic) {
			return NextResponse.json(
				{ error: "Não é possível mostrar perguntas anônimas publicamente se não aceita perguntas anônimas" },
				{ status: 400 },
			);
		}

		const updatedUser = await prisma.user.update({
			where: {
				id: session.user.id,
			},
			data: {
				privacy_accept_anonymous_questions: acceptAnonymousQuestions,
				privacy_show_anonymous_questions_public: showQuestionsAnonymousAnsweredPublic,
				privacy_show_total_questions_received_public: showTotalQuestionsReceived,
				privacy_show_total_questions_answered_public: showTotalQuestionsAnswered,
				privacy_show_total_questions_sent_public: showTotalQuestionSent,
				privacy_show_questions_answered_only_to_followers: showAnsweredToFollowersOnly,
				privacy_show_value_received_from_answering_question: showPaymentAmountEachQuestion,
				privacy_show_date_questions_was_answered: showAnswerDate,
				privacy_show_total_followers_public: showFollowersCount,
				privacy_show_likes_each_answer_public: showIndividualLikes,
				privacy_show_dislikes_each_answer_public: showIndividualDislikes,
				privacy_show_total_likes_all_answers_public: showTotalLikes,
				updated_at: new Date(),
			},
		});

		return NextResponse.json(
			{
				message: "Minha Conta de privacidade atualizadas com sucesso",
				user: {
					id: updatedUser.id,
					privacy_accept_anonymous_questions: updatedUser.privacy_accept_anonymous_questions,
					privacy_show_anonymous_questions_public: updatedUser.privacy_show_anonymous_questions_public,
					privacy_show_total_questions_received_public:
						updatedUser.privacy_show_total_questions_received_public,
					privacy_show_total_questions_answered_public:
						updatedUser.privacy_show_total_questions_answered_public,
					privacy_show_total_questions_sent_public: updatedUser.privacy_show_total_questions_sent_public,
					privacy_show_questions_answered_only_to_followers:
						updatedUser.privacy_show_questions_answered_only_to_followers,
					privacy_show_value_received_from_answering_question:
						updatedUser.privacy_show_value_received_from_answering_question,
					privacy_show_date_questions_was_answered: updatedUser.privacy_show_date_questions_was_answered,
					privacy_show_total_followers_public: updatedUser.privacy_show_total_followers_public,
					privacy_show_likes_each_answer_public: updatedUser.privacy_show_likes_each_answer_public,
					privacy_show_dislikes_each_answer_public: updatedUser.privacy_show_dislikes_each_answer_public,
					privacy_show_total_likes_all_answers_public:
						updatedUser.privacy_show_total_likes_all_answers_public,
				},
			},
			{ status: 200 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error file update-privacy-settings.ts: ${error?.message}`);
		return NextResponse.json({ error: error?.message ?? "Erro interno do servidor" }, { status: 500 });
	}
}
