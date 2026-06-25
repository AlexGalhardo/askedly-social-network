import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Question {
	id: string;
	text: string;
	amount: number;
	timestamp: string;
}

interface QuestionListProps {
	questions: Question[];
}

export function QuestionList({ questions }: QuestionListProps) {
	if (questions.length === 0) {
		return (
			<div className="text-center py-12 text-muted-foreground">
				Nenhuma pergunta feita ainda. Seja o primeiro a perguntar!
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">Perguntas recentes</h2>

			{questions.map((question) => (
				<Card key={question.id} className="border-blue-100">
					<CardHeader className="pb-2">
						<div className="flex justify-between items-start">
							<CardTitle className="text-lg font-medium">{question.text}</CardTitle>
							<span className="text-sm text-muted-foreground">{formatDate(question.timestamp)}</span>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-right font-medium text-blue-600">
							Valor pago: {formatCurrency(question.amount)}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
