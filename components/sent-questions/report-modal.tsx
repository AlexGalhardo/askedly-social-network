"use client";

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
	return (
		<Dialog open={isOpen} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Reportar Resposta</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<p className="text-sm text-gray-600 dark:text-white">Por que você está reportando esta resposta?</p>

					<RadioGroup value={reportReason} onValueChange={onReportReasonChange}>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="offensive" id="offensive" />
							<Label htmlFor="offensive">Resposta ofensiva</Label>
						</div>
						<div className="flex items-center space-x-2">
							<RadioGroupItem value="inappropriate" id="inappropriate" />
							<Label htmlFor="inappropriate">Resposta inadequada</Label>
						</div>
					</RadioGroup>

					<div className="flex gap-2 justify-end">
						<Button variant="outline" onClick={() => onOpenChange(false)}>
							Cancelar
						</Button>
						<Button
							onClick={onConfirmReport}
							className="bg-red-600 text-white hover:bg-red-700"
							disabled={!reportReason || isReporting}
						>
							{isReporting ? "Reportando..." : "Reportar Essa Resposta"}
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
