"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/loading-screen";
import { PaymentTabs } from "@/components/payments/payment-tabs";
import { PaymentWithdrawModal } from "@/components/payments/payment-withdraw-modal";
import { useAnsweredPaymentDetails, useProcessWithdraw, useSentPaymentDetails } from "@/hooks/use-payments";
import TelegramLog from "@/lib/telegram-logger";
import { canWithdraw } from "@/lib/utils/payment-utils";
import { PaymentTab } from "@/types/PaymentInterface";

export default function PagamentosPage() {
	const router = useRouter();
	const { data: session, status } = useSession();

	const { data: answeredData, isLoading: isLoadingAnswered, error: answeredError } = useAnsweredPaymentDetails();

	const { data: sentData, isLoading: isLoadingSent, error: sentError } = useSentPaymentDetails();

	const withdrawMutation = useProcessWithdraw();

	const [activeTab, setActiveTab] = useState<PaymentTab>("respondidas");
	const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

	useEffect(() => {
		if (status !== "loading" && !session) {
			router.push("/entrar");
		}
	}, [session, status, router]);

	const handleWithdraw = () => {
		setIsWithdrawModalOpen(true);
	};

	const handleConfirmWithdraw = async () => {
		if (!session?.user) return;

		const currentData = activeTab === "respondidas" ? answeredData : sentData;
		if (!currentData || !canWithdraw(currentData.paymentToWithdraw)) return;

		try {
			await withdrawMutation.mutateAsync({
				questionIds: currentData.questionsToPayAmount.map((question) => question.id),
			});

			setIsWithdrawModalOpen(false);
		} catch (error: any) {
			await TelegramLog.error(`Erro payment-actions.ts handleConfirmWithdraw: ${error?.message}`);
		}
	};

	if (status === "loading" || isLoadingAnswered || isLoadingSent) {
		return <LoadingScreen />;
	}

	if (!session) {
		router.push("/entrar");
		return null;
	}

	if (answeredError || sentError) {
		return (
			<main className="p-4 lg:p-6">
				<div className="text-center py-12">
					<p className="text-muted-foreground">Erro ao carregar dados de pagamento. Tente novamente.</p>
				</div>
			</main>
		);
	}

	const currentData = activeTab === "respondidas" ? answeredData : sentData;

	return (
		<main className="p-4 lg:p-6">
			<PaymentTabs
				answeredData={answeredData || null}
				sentData={sentData || null}
				activeTab={activeTab}
				onTabChange={setActiveTab}
				onWithdraw={handleWithdraw}
				isProcessingWithdraw={withdrawMutation.isPending}
				isLoading={isLoadingAnswered || isLoadingSent}
			/>

			<PaymentWithdrawModal
				isOpen={isWithdrawModalOpen}
				onOpenChange={setIsWithdrawModalOpen}
				amount={currentData?.paymentToWithdraw || 0}
				pixKey={session.user.pix_key}
				onConfirmWithdraw={handleConfirmWithdraw}
				isProcessing={withdrawMutation.isPending}
			/>
		</main>
	);
}
