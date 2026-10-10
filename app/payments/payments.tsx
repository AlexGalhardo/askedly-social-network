"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import LoadingScreen from "@/components/loading-screen";
import { PaymentTabs } from "@/components/payments/payment-tabs";
import { PaymentWithdrawModal } from "@/components/payments/payment-withdraw-modal";
import { useAnsweredPaymentDetails, useProcessWithdraw, useSentPaymentDetails } from "@/hooks/use-payments";
import { PaymentTab } from "@/lib/interfaces";
import TelegramLog from "@/lib/telegram-logger";
import { canWithdraw } from "@/lib/utils/payment-utils";

export default function PaymentsClient() {
	const t = useTranslations("payments");
	const router = useRouter();
	const { data: session, status } = useSession();

	const { data: answeredData, isLoading: isLoadingAnswered, error: answeredError } = useAnsweredPaymentDetails();

	const { data: sentData, isLoading: isLoadingSent, error: sentError } = useSentPaymentDetails();

	const withdrawMutation = useProcessWithdraw();

	const [activeTab, setActiveTab] = useState<PaymentTab>("answered");
	const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

	useEffect(() => {
		if (status !== "loading" && !session) {
			router.push("/login");
		}
	}, [session, status, router]);

	const handleWithdraw = () => {
		setIsWithdrawModalOpen(true);
	};

	const handleConfirmWithdraw = async () => {
		if (!session?.user) return;

		const currentData = activeTab === "answered" ? answeredData : sentData;
		if (!currentData || !canWithdraw(currentData.paymentToWithdraw)) return;

		try {
			await withdrawMutation.mutateAsync({
				questionIds: currentData.questionsToPayAmount.map((question) => question.id),
			});

			setIsWithdrawModalOpen(false);
		} catch (error: any) {
			await TelegramLog.error(`Error payments.tsx handleConfirmWithdraw: ${error?.message}`);
		}
	};

	if (status === "loading" || isLoadingAnswered || isLoadingSent) {
		return <LoadingScreen />;
	}

	if (!session) {
		router.push("/login");
		return null;
	}

	if (answeredError || sentError) {
		return (
			<div className="p-4 lg:p-6">
				<div className="text-center py-12">
					<p className="text-muted-foreground">{t("loadErrorRetry")}</p>
				</div>
			</div>
		);
	}

	const currentData = activeTab === "answered" ? answeredData : sentData;

	return (
		<div className="p-4 lg:p-6">
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
		</div>
	);
}
