"use client";

import { useTranslations } from "next-intl";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentData, PaymentTab } from "@/lib/interfaces";
import { PaymentTabContent } from "./payment-tab-content";

interface PaymentTabsProps {
	answeredData: PaymentData | null;
	sentData: PaymentData | null;
	activeTab: PaymentTab;
	onTabChange: (tab: PaymentTab) => void;
	onWithdraw: () => void;
	isProcessingWithdraw?: boolean;
	isLoading?: boolean;
}

export function PaymentTabs({
	answeredData,
	sentData,
	activeTab,
	onTabChange,
	onWithdraw,
	isProcessingWithdraw = false,
	isLoading = false,
}: PaymentTabsProps) {
	const t = useTranslations("payments");
	const currentData = activeTab === "answered" ? answeredData : sentData;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-muted-foreground">{t("loading")}</div>
			</div>
		);
	}

	if (!currentData) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">{t("loadError")}</p>
			</div>
		);
	}

	return (
		<Tabs value={activeTab} onValueChange={(value) => onTabChange(value as PaymentTab)} className="w-full">
			<TabsList className="flex flex-wrap justify-between gap-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
				<TabsTrigger
					value="answered"
					className="flex-1 text-xs sm:text-sm py-2 px-2 rounded-md text-center font-medium transition-all duration-200 data-[active]:bg-white data-[active]:shadow-sm not-data-[active]:opacity-70 dark:data-[active]:bg-white dark:data-[active]:text-black dark:not-data-[active]:bg-neutral-700 dark:not-data-[active]:text-neutral-300"
				>
					{t("tabs.answered")}
				</TabsTrigger>
				<TabsTrigger
					value="sent"
					className="flex-1 text-xs sm:text-sm py-2 px-2 rounded-md text-center font-medium transition-all duration-200 data-[active]:bg-white data-[active]:shadow-sm not-data-[active]:opacity-70 dark:data-[active]:bg-white dark:data-[active]:text-black dark:not-data-[active]:bg-neutral-700 dark:not-data-[active]:text-neutral-300"
				>
					{t("tabs.sent")}
				</TabsTrigger>
			</TabsList>

			<TabsContent value="answered">
				{answeredData && (
					<PaymentTabContent
						data={answeredData}
						type="answered"
						onWithdraw={onWithdraw}
						isProcessingWithdraw={isProcessingWithdraw}
					/>
				)}
			</TabsContent>

			<TabsContent value="sent">
				{sentData && (
					<PaymentTabContent
						data={sentData}
						type="sent"
						onWithdraw={onWithdraw}
						isProcessingWithdraw={isProcessingWithdraw}
					/>
				)}
			</TabsContent>
		</Tabs>
	);
}
