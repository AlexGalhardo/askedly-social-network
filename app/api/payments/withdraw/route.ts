import { NextRequest, NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";
import { prisma } from "@/prisma/prisma-client";

interface ValidQuestion {
	id: string;
	asked_by_user_nickname: string;
	owner_user_nickname: string;
	question_answered: boolean;
	question_is_awaiting_answer: boolean;
	amount_already_withdraw: boolean;
}

interface PaymentWithdraw {
	id: string;
	user_id: string;
	user_nickname: string;
	send_to_pix_key: string;
	amount_withdraw: number;
}

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { userId, nickname, amount, sentToPixKey, questions } = body;

		if (!userId || !nickname || !amount || !sentToPixKey || !Array.isArray(questions)) {
			return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
		}

		const questionIds = questions.map((q: any) => q.id);

		const validQuestions = await prisma.question.findMany({
			where: {
				id: { in: questionIds },
				OR: [
					{
						owner_user_nickname: nickname,
						question_answered: true,
						question_is_awaiting_answer: false,
						amount_already_withdraw: false,
					},
					{
						asked_by_user_nickname: nickname,
						amount_already_withdraw: false,
						payment_withdraw_id: null,
						OR: [
							{ question_answer_was_recused: true },
							{ question_answer_was_expired: true },
							{ onwer_reported_question_at: { not: null } },
							{ question_answer_recused_at: { not: null } },
							{ question_answer_expired_at: { not: null } },
						],
					},
				],
			},
		});

		if (validQuestions.length !== questions.length) {
			return NextResponse.json(
				{
					success: false,
					error: "Algumas questões são inválidas ou já foram processadas para pagamento.",
				},
				{ status: 400 },
			);
		}

		const paymentWithdraw: PaymentWithdraw = await prisma.paymentWithdraw.create({
			data: {
				user_id: userId as string,
				user_nickname: nickname as string,
				send_to_pix_key: sentToPixKey as string,
				amount_withdraw: amount as number,
				questions: {
					connect: (validQuestions as ValidQuestion[]).map((q) => ({ id: q.id })),
				},
			},
		});

		const updates = await prisma.question.updateMany({
			where: {
				id: { in: questionIds },
			},
			data: {
				amount_already_withdraw: true,
				payment_withdraw_id: paymentWithdraw.id,
			},
		});

		return NextResponse.json(
			{
				success: true,
				message: "Saque realizado com sucesso!",
				withdrawId: paymentWithdraw.id,
			},
			{ status: 201 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Catch Error payment-actions.ts withdraw: ${error?.message}`);
		return NextResponse.json(
			{
				success: false,
				error: "Erro interno no servidor. Tente novamente.",
			},
			{ status: 500 },
		);
	}
}
