"use client";

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
	return (
		<>
			<Dialog open={isAnswerModalOpen} onOpenChange={onAnswerModalChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirmar resposta?</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="font-bold text-white-700">
							Essa resposta não pode ser editada depois de enviada.
						</p>
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button
							className="bg-red-500 hover:bg-red-800 text-white"
							onClick={() => onAnswerModalChange(false)}
						>
							Cancelar
						</Button>
						<Button onClick={onConfirmAnswer} className="bg-green-500 hover:bg-green-800 text-white">
							Confirmar Resposta
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeclineModalOpen} onOpenChange={onDeclineModalChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirmar recusa?</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="text-sm text-gray-700">
							Você tem certeza que não quer responder a esta pergunta? Essa ação não pode ser desfeita.
						</p>
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => onDeclineModalChange(false)}>
							Cancelar
						</Button>
						<Button onClick={onConfirmDecline} variant="destructive">
							Confirmar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isDeleteModalOpen} onOpenChange={onDeleteModalChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Confirmar exclusão?</DialogTitle>
					</DialogHeader>
					<div className="py-4">
						<p className="text-sm text-gray-700">
							Esta ação não pode ser desfeita. A pergunta será removida permanentemente.
						</p>
					</div>
					<DialogFooter className="flex justify-end gap-2">
						<Button variant="outline" onClick={() => onDeleteModalChange(false)}>
							Cancelar
						</Button>
						<Button onClick={onConfirmDelete} variant="destructive">
							Deletar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Dialog open={isReportModalOpen} onOpenChange={onReportModalChange}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Reportar Pergunta</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-sm text-gray-600">Por que você está reportando esta pergunta?</p>

						<RadioGroup value={reportReason} onValueChange={onReportReasonChange}>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="offensive" id="offensive" />
								<Label htmlFor="offensive">Pergunta Ofensiva</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem value="inappropriate" id="inappropriate" />
								<Label htmlFor="inappropriate">Pergunta Inapropriada</Label>
							</div>
						</RadioGroup>

						<div className="flex gap-2 justify-end">
							<Button variant="outline" onClick={() => onReportModalChange(false)}>
								Cancelar
							</Button>
							<Button
								onClick={onConfirmReport}
								className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
							>
								Enviar
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
