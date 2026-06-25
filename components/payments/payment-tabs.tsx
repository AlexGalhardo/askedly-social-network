"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PaymentTabContent } from "./payment-tab-content";
import { PaymentData, PaymentTab } from "@/types/PaymentInterface";

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
	const currentData = activeTab === "respondidas" ? answeredData : sentData;

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<div className="text-muted-foreground">Carregando dados de pagamento...</div>
			</div>
		);
	}

	if (!currentData) {
		return (
			<div className="text-center py-12">
				<p className="text-muted-foreground">Erro ao carregar dados de pagamento</p>
			</div>
		);
	}

	return (
		<Tabs value={activeTab} onValueChange={(value) => onTabChange(value as PaymentTab)} className="w-full">
			<TabsList className="flex flex-wrap justify-between gap-2 w-full bg-gray-100 dark:bg-neutral-800 rounded-lg p-1">
				<TabsTrigger
					value="respondidas"
					className="flex-1 text-xs sm:text-sm py-2 px-2 rounded-md text-center font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=inactive]:opacity-70 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=inactive]:bg-neutral-700 dark:data-[state=inactive]:text-neutral-300"
				>
					Perguntas Respondidas
				</TabsTrigger>
				<TabsTrigger
					value="enviadas"
					className="flex-1 text-xs sm:text-sm py-2 px-2 rounded-md text-center font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=inactive]:opacity-70 dark:data-[state=active]:bg-white dark:data-[state=active]:text-black dark:data-[state=inactive]:bg-neutral-700 dark:data-[state=inactive]:text-neutral-300"
				>
					Perguntas Enviadas
				</TabsTrigger>
			</TabsList>

			<TabsContent value="respondidas">
				{answeredData && (
					<PaymentTabContent
						data={answeredData}
						type="answered"
						onWithdraw={onWithdraw}
						isProcessingWithdraw={isProcessingWithdraw}
					/>
				)}
			</TabsContent>

			<TabsContent value="enviadas">
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
