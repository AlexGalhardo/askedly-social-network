import { NextRequest, NextResponse } from "next/server";
import TelegramLog from "@/lib/telegram-logger";
import { formatCurrency } from "@/lib/utils";
import { prisma } from "@/prisma/prisma-client";
import { randomUUID } from "node:crypto";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			question_text,
			amount_paid,
			is_anonymous,
			asker_want_answer_to_be_private,
			amount_paid_is_private,
			pix_id,
			owner_user_id,
			asker_id,
		} = body;

		if (!question_text?.trim()) {
			await TelegramLog.error(`Question Create: ❌ Texto da pergunta é obrigatório`);
			return NextResponse.json({ error: "Texto da pergunta é obrigatório" }, { status: 400 });
		}

		if (!pix_id) {
			await TelegramLog.error("Question Create: ❌ PIX ID é obrigatório");
			return NextResponse.json({ error: "PIX ID é obrigatório" }, { status: 400 });
		}

		if (!owner_user_id) {
			await TelegramLog.error("Question Create: ❌ ID do proprietário é obrigatório");
			return NextResponse.json({ error: "ID do proprietário é obrigatório" }, { status: 400 });
		}

		if (typeof amount_paid !== "number" || amount_paid < 200) {
			await TelegramLog.error("Question Create: ❌ Valor a pagar deve ser pelo menos R$ 2,00");
			return NextResponse.json({ error: "Valor a pagar deve ser pelo menos R$ 2,00" }, { status: 400 });
		}

		const ownerUser = await prisma.user.findUnique({
			where: { id: owner_user_id },
		});

		if (!ownerUser) {
			await TelegramLog.error("Question Create: ❌ Usuário proprietário não encontrado");
			return NextResponse.json({ error: "Usuário proprietário não encontrado" }, { status: 404 });
		}

		const askerUser = await prisma.user.findUnique({
			where: { id: asker_id },
		});

		if (!askerUser) {
			await TelegramLog.error("Question Create: ❌ Usuário que fez o pagamento não encontrado");
			return NextResponse.json({ error: "Usuário que fez o pagamento não encontrado" }, { status: 404 });
		}

		let webhook,
			existingQuestion = null;

		if (process.env.NEXT_PUBLIC_TEST_MODE !== "true") {
			webhook = await prisma.webhookAbacatePay.findUnique({
				where: { pix_id: pix_id },
			});

			if (!webhook) {
				await TelegramLog.error("Question Create: ❌ Webhook não encontrado");
				return NextResponse.json({ error: "Webhook não encontrado" }, { status: 404 });
			}

			existingQuestion = await prisma.question.findFirst({
				where: { webhook_id: webhook.id },
			});

			if (existingQuestion) {
				await TelegramLog.error("Question Create: ❌ Já existe uma pergunta associada a este pagamento");
				return NextResponse.json(
					{ error: "Já existe uma pergunta associada a este pagamento" },
					{ status: 400 },
				);
			}
		} else {
			webhook = await prisma.webhookAbacatePay.create({
				data: {
					pix_id: `pix_char_DEVMODE_${randomUUID()}`,
					status: "completed",
					amount: amount_paid,
					fee: 0,
					kind: "payment",
					event_status: "received",
					dev_mode: true,
					complete_event: "payment.completed",
				},
			});
		}

		if (is_anonymous) {
			await prisma.user.update({
				where: {
					id: askerUser.id,
				},
				data: {
					anonymous_questions_remaining_today: {
						decrement: 1,
					},
				},
			});
		} else {
			await prisma.user.update({
				where: {
					id: askerUser.id,
				},
				data: {
					public_questions_remaining_today: {
						decrement: 1,
					},
				},
			});
		}

		const newQuestion = await prisma.question.create({
			data: {
				question_text: question_text.trim(),
				amount_paid,
				asker_want_answer_to_be_private: asker_want_answer_to_be_private ?? false,
				asker_sent_anonymous_question: is_anonymous,
				amount_paid_is_private: amount_paid_is_private ?? false,
				owner_user_nickname: ownerUser.nickname,
				asked_by_user_nickname: askerUser.nickname,
				question_is_awaiting_answer: true,
				question_answered: false,
				question_answer_was_recused: false,
				question_answer_was_expired: false,
				liked_by_users: JSON.stringify([]),
				desliked_by_users: JSON.stringify([]),
				webhook_id: webhook.id,
			},
			include: {
				owner: {
					select: {
						id: true,
						name: true,
						nickname: true,
						avatar_url: true,
					},
				},
				asked_by: {
					select: {
						id: true,
						name: true,
						nickname: true,
						avatar_url: true,
					},
				},
				webhook: {
					select: {
						id: true,
						status: true,
						amount: true,
						created_at: true,
					},
				},
			},
		});

		TelegramLog.info(`NOVA PERGUNTA REGISTRADA:

		NICKNAME DE QUEM RECEBEU A PERGUNTA: @${ownerUser.nickname}

		PIX_ID: ${pix_id}
		PAGOU: ${formatCurrency(amount_paid)}
		PERGUNTA: ${question_text}

		QUEM MANDOU A PERGUNTA: @${askerUser.nickname}
		MANDOU PERGUNTA PRIVADA: ${asker_want_answer_to_be_private}
		MANDOU PERGUNTA ANONIMA: ${is_anonymous}
		`);

		return NextResponse.json(
			{
				message: "Pergunta criada com sucesso",
				question: newQuestion,
			},
			{ status: 201 },
		);
	} catch (error: any) {
		await TelegramLog.error(`Question Create catch error: ${error?.message}`);
		return NextResponse.json(
			{ success: false, error: error?.message ?? "Erro interno do servidor" },
			{ status: 500 },
		);
	}
}
