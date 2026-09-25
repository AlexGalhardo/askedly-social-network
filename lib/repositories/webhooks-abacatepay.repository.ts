import { prisma } from "@/prisma/prisma-client";

interface WebhookAbacatePay {
	paid_by_user_email: string;
	paid_by_user_nickname: string;
	pix_id: string;
	status: string;
	amount: number;
	fee: number;
	method: string;
	kind: string;
	event_status: string;
	dev_mode: boolean;
	complete_event: string;
}

class WebhooksAbacatePayRepository {
	async create({
		paid_by_user_email,
		paid_by_user_nickname,
		pix_id,
		status,
		amount,
		fee,
		method,
		kind,
		event_status,
		dev_mode,
		complete_event,
	}: WebhookAbacatePay) {
		return await prisma.webhookAbacatePay.create({
			data: {
				paid_by_user_email,
				paid_by_user_nickname,
				pix_id,
				status,
				amount,
				fee,
				method,
				kind,
				event_status,
				dev_mode,
				complete_event,
			},
		});
	}
}

const repo = new WebhooksAbacatePayRepository();

export async function createWebhookAbacatePay(webhookAbacatePayDto: WebhookAbacatePay) {
	return repo.create(webhookAbacatePayDto);
}
