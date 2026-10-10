import { useLocale, useTranslations } from "next-intl";
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
	const t = useTranslations("common.questionList");
	const locale = useLocale();

	if (questions.length === 0) {
		return <div className="text-center py-12 text-muted-foreground">{t("empty")}</div>;
	}

	return (
		<div className="space-y-6">
			<h2 className="text-2xl font-bold">{t("title")}</h2>

			{questions.map((question) => (
				<Card key={question.id} className="border-blue-100">
					<CardHeader className="pb-2">
						<div className="flex justify-between items-start">
							<CardTitle className="text-lg font-medium">{question.text}</CardTitle>
							<span className="text-sm text-muted-foreground">
								{formatDate(question.timestamp, locale)}
							</span>
						</div>
					</CardHeader>
					<CardContent>
						<p className="text-right font-medium text-blue-600">
							{t("amountPaid", { amount: formatCurrency(question.amount) })}
						</p>
					</CardContent>
				</Card>
			))}
		</div>
	);
}
