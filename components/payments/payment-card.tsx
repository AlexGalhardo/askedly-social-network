"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/payment-utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface PaymentCardProps {
	title: string;
	amount: number;
	description: string;
	icon: LucideIcon;
	iconBgColor: string;
	cardBgColor: string;
	borderColor: string;
	titleColor: string;
	children?: ReactNode;
	warning?: string;
	warningColor?: string;
}

export function PaymentCard({
	title,
	amount,
	description,
	icon: Icon,
	iconBgColor,
	cardBgColor,
	borderColor,
	titleColor,
	children,
	warning,
	warningColor = "text-red-600 dark:text-red-400",
}: PaymentCardProps) {
	return (
		<Card className={`${cardBgColor} ${borderColor}`}>
			<CardContent className="p-6">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
					<div className="flex items-center space-x-4">
						<div className={`w-12 h-12 ${iconBgColor} rounded-full flex items-center justify-center`}>
							<Icon className="h-6 w-6 text-white dark:text-background" />
						</div>
						<div>
							<p className={`text-3xl font-bold ${titleColor}`}>R$ {formatCurrency(amount)}</p>
							<p className="text-sm font-bold text-muted-foreground">{title}</p>
							<p className="text-sm text-muted-foreground mt-1">{description}</p>
							{warning && <p className={`text-sm font-bold mt-2 ${warningColor}`}>{warning}</p>}
						</div>
					</div>
					{children && <div className="sm:ml-auto w-full sm:w-auto">{children}</div>}
				</div>
			</CardContent>
		</Card>
	);
}
