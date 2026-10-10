"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ReportModalProps {
	isOpen: boolean;
	onOpenChange: (open: boolean) => void;
	reportReason: string;
	onReportReasonChange: (reason: string) => void;
	onConfirmReport: () => void;
	isReporting?: boolean;
}

export function ReportModal({
	isOpen,
	onOpenChange,
	reportReason,
	onReportReasonChange,
	onConfirmReport,
	isReporting = false,
}: ReportModalProps) {
	const t = useTranslations("questions");

	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("sent.reportModal.title")}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<p className="text-sm text-gray-600 dark:text-white">{t("sent.reportModal.prompt")}</p>

					<RadioGroup value={reportReason} onValueChange={onReportReasonChange}>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="offensive" id="offensive" />
							<Label htmlFor="offensive">{t("sent.reportModal.offensive")}</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="inappropriate" id="inappropriate" />
							<Label htmlFor="inappropriate">{t("sent.reportModal.inappropriate")}</Label>
						</div>
					</RadioGroup>

					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							{t("sent.reportModal.cancel")}
						</Button>
						<Button
							onClick={onConfirmReport}
							className="bg-red-600 text-white hover:bg-red-700"
							disabled={!reportReason || isReporting}
						>
							{isReporting ? t("sent.reporting") : t("sent.reportModal.confirm")}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
