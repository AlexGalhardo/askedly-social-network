"use client";

import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ConfirmationModalsProps {
	isAnswerModalOpen: boolean;
	isDeclineModalOpen: boolean;
	isDeleteModalOpen: boolean;
	isReportModalOpen: boolean;
	reportReason: string;
	onAnswerModalChange: (open: boolean) => void;
	onDeclineModalChange: (open: boolean) => void;
	onDeleteModalChange: (open: boolean) => void;
	onReportModalChange: (open: boolean) => void;
	onReportReasonChange: (reason: string) => void;
	onConfirmAnswer: () => void;
	onConfirmDecline: () => void;
	onConfirmDelete: () => void;
	onConfirmReport: () => void;
}

export function ConfirmationModals({
	isAnswerModalOpen,
	isDeclineModalOpen,
	isDeleteModalOpen,
	isReportModalOpen,
	reportReason,
	onAnswerModalChange,
	onDeclineModalChange,
	onDeleteModalChange,
	onReportModalChange,
	onReportReasonChange,
	onConfirmAnswer,
	onConfirmDecline,
	onConfirmDelete,
	onConfirmReport,
}: ConfirmationModalsProps) {
	const t = useTranslations("questions");

	return (
		<>
			<Dialog open={isAnswerModalOpen} onOpenChange={onAnswerModalChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("received.modals.answerTitle")}</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="font-bold text-white-700">{t("received.modals.answerBody")}</p>
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button
							className="bg-red-500 hover:bg-red-800 text-white"
							onClick={() => onAnswerModalChange(false)}
						>
							{t("received.modals.cancel")}
						</Button>
						<Button onClick={onConfirmAnswer} className="bg-green-500 hover:bg-green-800 text-white">
							{t("received.modals.answerConfirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeclineModalOpen} onOpenChange={onDeclineModalChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("received.modals.declineTitle")}</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="text-sm text-gray-700">{t("received.modals.declineBody")}</p>
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => onDeclineModalChange(false)}>
							{t("received.modals.cancel")}
						</Button>
						<Button onClick={onConfirmDecline} variant="destructive">
							{t("received.modals.declineConfirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteModalOpen} onOpenChange={onDeleteModalChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("received.modals.deleteTitle")}</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="text-sm text-gray-700">{t("received.modals.deleteBody")}</p>
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => onDeleteModalChange(false)}>
							{t("received.modals.cancel")}
						</Button>
						<Button onClick={onConfirmDelete} variant="destructive">
							{t("received.modals.deleteConfirm")}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isReportModalOpen} onOpenChange={onReportModalChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("received.modals.reportTitle")}</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-sm text-gray-600">{t("received.modals.reportPrompt")}</p>

						<RadioGroup value={reportReason} onValueChange={onReportReasonChange}>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="offensive" id="offensive" />
								<Label htmlFor="offensive">{t("received.modals.offensive")}</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="inappropriate" id="inappropriate" />
								<Label htmlFor="inappropriate">{t("received.modals.inappropriate")}</Label>
							</div>
						</RadioGroup>

						<div className="flex gap-2 justify-end">
							<Button variant="outline" onClick={() => onReportModalChange(false)}>
								{t("received.modals.cancel")}
							</Button>
							<Button
								onClick={onConfirmReport}
								className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
							>
								{t("received.modals.reportConfirm")}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
