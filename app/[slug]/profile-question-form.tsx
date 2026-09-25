"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface QuestionFormProps {
	profile: any;
	session: any;
	onSubmitQuestion: (question: string) => void;
}

export function ProfileQuestionForm({ profile, session, onSubmitQuestion }: QuestionFormProps) {
	const [newQuestion, setNewQuestion] = useState("");
	const { toast } = useToast();

	const handleSubmit = () => {
		if (newQuestion.length < 32) {
			toast({
				title: "Pergunta muito curta",
				description: "A pergunta deve ter pelo menos 32 caracteres.",
				variant: "error",
			});
			return;
		}

		if (newQuestion.length > 512) {
			toast({
				title: "Pergunta muito longa",
				description: "A pergunta deve ter no máximo 512 caracteres.",
				variant: "error",
			});
			return;
		}

		onSubmitQuestion(newQuestion);
	};

	if (!session?.user?.id || session.user.id === profile.id) {
		return null;
	}

	const hasQuestionsRemaining =
		(session.user.public_questions_remaining_today ?? 0) > 0 ||
		(session.user.anonymous_questions_remaining_today ?? 0) > 0;

	if (!hasQuestionsRemaining) {
		return null;
	}

	return (
		<>
			<div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
				<Card className="bg-gradient-to-r from-blue-100 to-blue-50 border-blue-200 dark:bg-white dark:border-gray-300">
					<CardContent className="p-3">
						<div className="flex items-center gap-2">
							<Eye className="h-6 w-6 text-blue-600 dark:text-black flex-shrink-0" />
							<div>
								<p className="md:text-base font-semibold text-blue-800 dark:text-black leading-tight">
									{session?.user?.public_questions_remaining_today} perguntas públicas restantes hoje
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="bg-gradient-to-r from-purple-100 to-purple-50 border-purple-200 dark:bg-white dark:border-gray-300">
					<CardContent className="p-3">
						<div className="flex items-center gap-2">
							<EyeOff className="h-6 w-6 text-purple-600 dark:text-black flex-shrink-0" />
							<div>
								{!profile?.privacy_accept_anonymous_questions ? (
									<p className="text md:text-base font-semibold text-purple-800 dark:text-black leading-tight">
										Esse perfil não aceita perguntas anônimas.
									</p>
								) : (
									<p className="md:text-base font-semibold text-purple-800 dark:text-black leading-tight">
										{session?.user?.anonymous_questions_remaining_today} pergunta anônima restante
										hoje
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			<Card className="mb-6">
				<CardHeader className="pb-4">
					<CardTitle className="text-center text-lg md:text-xl text-gray-700 dark:text-white">
						Faça uma pergunta para <span className="text-orange-600 font-bold">@{profile.nickname}</span>
					</CardTitle>
				</CardHeader>
				<CardContent className="pt-0">
					<div className="space-y-4">
						<div className="space-y-2">
							<Textarea
								placeholder="Digite sua pergunta aqui..."
								value={newQuestion}
								onChange={(e) => setNewQuestion(e.target.value)}
								className="text-base p-3 min-h-[100px] resize-none"
								rows={4}
							/>
							<div className="flex justify-between text-xs text-gray-500">
								<small>Mínimo: 32 | Máximo: 512 caracteres</small>
								<small className={newQuestion.length > 512 ? "text-red-500" : ""}>
									{newQuestion.length}/512
								</small>
							</div>
						</div>

						<Button
							onClick={handleSubmit}
							className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 text-white text-base py-4 md:py-6 dark:from-white dark:to-gray-100 dark:text-black dark:hover:from-gray-100 dark:hover:to-gray-200"
							disabled={newQuestion.length < 32 || newQuestion.length > 512}
						>
							RESPONDE AÊ
						</Button>
					</div>
				</CardContent>
			</Card>
		</>
	);
}
