import { calculatePayout } from "@/lib/services/withdraw.service";
import { prisma } from "@/prisma/prisma-client";

export async function isAdmin(userId: string): Promise<boolean> {
	const user = await prisma.user.findUnique({ where: { id: userId }, select: { is_admin: true } });
	return user?.is_admin === true;
}

export interface CurrencyTotals {
	questions: number;
	volumeCents: number;
	/** The platform's share of answered questions. */
	platformRevenueCents: number;
}

export interface AdminDashboard {
	users: number;
	payoutAccounts: number;
	questions: { total: number; answered: number; awaiting: number; refused: number; expired: number };
	brl: CurrencyTotals;
	usd: CurrencyTotals;
	credits: { purchases: number; purchasedCents: number; outstandingCents: number; pendingSettlements: number };
	withdrawals: { count: number; totalCents: number };
	latestPurchases: { id: string; nickname: string; amountCents: number; status: string; createdAt: Date }[];
	latestWithdrawals: { id: string; nickname: string; amountCents: number; createdAt: Date }[];
}

async function currencyTotals(currency: "BRL" | "USD"): Promise<CurrencyTotals> {
	const [all, answered] = await Promise.all([
		prisma.question.aggregate({ where: { currency }, _count: true, _sum: { amount_paid: true } }),
		prisma.question.findMany({ where: { currency, question_answered: true }, select: { amount_paid: true } }),
	]);
	return {
		questions: all._count,
		volumeCents: all._sum.amount_paid ?? 0,
		platformRevenueCents: answered.reduce((sum, q) => sum + q.amount_paid - calculatePayout(q.amount_paid), 0),
	};
}

/** Numbers for the whole platform. The caller must check `isAdmin` with the session id first. */
export async function getAdminDashboard(): Promise<AdminDashboard> {
	const [
		users,
		payoutAccounts,
		total,
		answered,
		awaiting,
		refused,
		expired,
		brl,
		usd,
		purchases,
		outstanding,
		pendingSettlements,
		withdrawals,
		latestPurchases,
		latestWithdrawals,
	] = await Promise.all([
		prisma.user.count(),
		prisma.user.count({ where: { stripe_account_id: { not: null } } }),
		prisma.question.count(),
		prisma.question.count({ where: { question_answered: true } }),
		prisma.question.count({ where: { question_is_awaiting_answer: true } }),
		prisma.question.count({ where: { question_answer_was_recused: true } }),
		prisma.question.count({ where: { question_answer_was_expired: true } }),
		currencyTotals("BRL"),
		currencyTotals("USD"),
		prisma.stripePurchase.aggregate({ where: { status: "completed" }, _count: true, _sum: { amount_cents: true } }),
		prisma.user.aggregate({ _sum: { credits_cents: true } }),
		prisma.question.count({
			where: { currency: "USD", amount_already_withdraw: false, question_is_awaiting_answer: false },
		}),
		prisma.paymentWithdraw.aggregate({ _count: true, _sum: { amount_withdraw: true } }),
		prisma.stripePurchase.findMany({
			orderBy: { created_at: "desc" },
			take: 10,
			select: {
				id: true,
				amount_cents: true,
				status: true,
				created_at: true,
				user: { select: { nickname: true } },
			},
		}),
		prisma.paymentWithdraw.findMany({
			orderBy: { created_at: "desc" },
			take: 10,
			select: { id: true, user_nickname: true, amount_withdraw: true, created_at: true },
		}),
	]);

	return {
		users,
		payoutAccounts,
		questions: { total, answered, awaiting, refused, expired },
		brl,
		usd,
		credits: {
			purchases: purchases._count,
			purchasedCents: purchases._sum.amount_cents ?? 0,
			outstandingCents: outstanding._sum.credits_cents ?? 0,
			pendingSettlements,
		},
		withdrawals: { count: withdrawals._count, totalCents: withdrawals._sum.amount_withdraw ?? 0 },
		latestPurchases: latestPurchases.map((p) => ({
			id: p.id,
			nickname: p.user.nickname,
			amountCents: p.amount_cents,
			status: p.status,
			createdAt: p.created_at,
		})),
		latestWithdrawals: latestWithdrawals.map((w) => ({
			id: w.id,
			nickname: w.user_nickname,
			amountCents: w.amount_withdraw,
			createdAt: w.created_at,
		})),
	};
}
