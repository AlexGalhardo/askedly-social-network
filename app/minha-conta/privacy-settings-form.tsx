// components/account/privacy-settings-form.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { useUpdatePrivacySettings } from "@/hooks/use-account-mutations";

interface PrivacySettingsFormProps {
	user: {
		privacy_is_private_profile?: boolean;
		privacy_accept_anonymous_questions?: boolean;
		privacy_show_anonymous_questions_public?: boolean;
		privacy_show_total_questions_received_public?: boolean;
		privacy_show_total_questions_answered_public?: boolean;
		privacy_show_total_questions_sent_public?: boolean;
		privacy_show_questions_answered_only_to_followers?: boolean;
		privacy_show_value_received_from_answering_question?: boolean;
		privacy_show_date_questions_was_answered?: boolean;
		privacy_show_total_followers_public?: boolean;
		privacy_show_likes_each_answer_public?: boolean;
		privacy_show_dislikes_each_answer_public?: boolean;
		privacy_show_total_likes_all_answers_public?: boolean;
	};
}

export function PrivacySettingsForm({ user }: any) {
	const [isPending, startTransition] = useTransition();
	const updatePrivacySettingsMutation = useUpdatePrivacySettings();

	const [isPrivateProfile, setIsPrivateProfile] = useState(user.privacy_is_private_profile ?? false);

	const [acceptAnonymousQuestions, setAcceptAnonymousQuestions] = useState(
		user.privacy_accept_anonymous_questions ?? true,
	);
	const [showQuestionsAnonymousAnsweredPublic, setShowQuestionsAnonymousAnsweredPublic] = useState(
		user.privacy_show_anonymous_questions_public ?? false,
	);
	const [showTotalQuestionsReceived, setShowTotalQuestionsReceived] = useState(
		user.privacy_show_total_questions_received_public ?? true,
	);
	const [showTotalQuestionsAnswered, setShowTotalQuestionsAnswered] = useState(
		user.privacy_show_total_questions_answered_public ?? true,
	);
	const [showTotalQuestionSent, setShowQuestionsSent] = useState(
		user.privacy_show_total_questions_sent_public ?? true,
	);
	const [showAnsweredToFollowersOnly, setShowAnsweredToFollowersOnly] = useState(
		user.privacy_show_questions_answered_only_to_followers ?? false,
	);
	const [showPaymentAmountEachQuestion, setShowPaymentAmountEachQuestion] = useState(
		user.privacy_show_value_received_from_answering_question ?? true,
	);
	const [showAnswerDate, setShowAnswerDate] = useState(user.privacy_show_date_questions_was_answered ?? true);
	const [showFollowersCount, setShowFollowersCount] = useState(user.privacy_show_total_followers_public ?? true);
	const [showIndividualLikes, setShowIndividualLikes] = useState(user.privacy_show_likes_each_answer_public ?? true);
	const [showIndividualDislikes, setShowIndividualDislikes] = useState(
		user.privacy_show_dislikes_each_answer_public ?? false,
	);
	const [showTotalLikes, setShowTotalLikes] = useState(user.privacy_show_total_likes_all_answers_public ?? true);

	const handleSubmit = (formData: FormData) => {
		formData.set("isPrivateProfile", isPrivateProfile.toString());
		formData.set("acceptAnonymousQuestions", acceptAnonymousQuestions.toString());
		formData.set("showQuestionsAnonymousAnsweredPublic", showQuestionsAnonymousAnsweredPublic.toString());
		formData.set("showTotalQuestionsReceived", showTotalQuestionsReceived.toString());
		formData.set("showTotalQuestionsAnswered", showTotalQuestionsAnswered.toString());
		formData.set("showTotalQuestionSent", showTotalQuestionSent.toString());
		formData.set("showAnsweredToFollowersOnly", showAnsweredToFollowersOnly.toString());
		formData.set("showPaymentAmountEachQuestion", showPaymentAmountEachQuestion.toString());
		formData.set("showAnswerDate", showAnswerDate.toString());
		formData.set("showFollowersCount", showFollowersCount.toString());
		formData.set("showIndividualLikes", showIndividualLikes.toString());
		formData.set("showIndividualDislikes", showIndividualDislikes.toString());
		formData.set("showTotalLikes", showTotalLikes.toString());

		startTransition(() => {
			updatePrivacySettingsMutation.mutate(formData);
		});
	};

	const isLoading = isPending || updatePrivacySettingsMutation.isPending;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Configurações de Privacidade</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={handleSubmit} className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Meu Perfil Será Privado</Label>
							<p className="text-sm text-gray-500">
								Pessoas não poderão seguir você livremente, elas vão pedir uma soliticação para te
								seguir primeiro. <br />
								Apenas seguidores conseguem ver suas respostas públicas.
							</p>
						</div>
						<Switch checked={isPrivateProfile} onCheckedChange={setIsPrivateProfile} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Aceitar perguntas anônimas</Label>
							<p className="text-sm text-gray-500">
								Permitir que pessoas façam perguntas sem se identificar
							</p>
						</div>
						<Switch checked={acceptAnonymousQuestions} onCheckedChange={setAcceptAnonymousQuestions} />
					</div>

					{acceptAnonymousQuestions && (
						<div className="flex items-center justify-between pl-4 border-l-2 border-green-200">
							<div className="space-y-0.5">
								<Label>Mostrar perguntas anônimas respondidas publicamente</Label>
								<p className="text-sm text-gray-500">
									Exibir suas respostas a perguntas anônimas no seu perfil público
								</p>
							</div>
							<Switch
								checked={showQuestionsAnonymousAnsweredPublic}
								onCheckedChange={setShowQuestionsAnonymousAnsweredPublic}
							/>
						</div>
					)}

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar perguntas respondidas apenas para seguidores</Label>
							<p className="text-sm text-gray-500">Apenas seus seguidores poderão ver suas respostas</p>
						</div>
						<Switch
							checked={showAnsweredToFollowersOnly}
							onCheckedChange={setShowAnsweredToFollowersOnly}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar valor recebido para responder pergunta</Label>
							<p className="text-sm text-gray-500">
								Exibir quanto você recebeu R$ por cada resposta (se o usuario que enviou a pergunta não
								quis mostrar o valor que ele pagou, essas respostas não exibirão o valor pago)
							</p>
						</div>
						<Switch
							checked={showPaymentAmountEachQuestion}
							onCheckedChange={setShowPaymentAmountEachQuestion}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar data que pergunta foi respondida</Label>
							<p className="text-sm text-gray-500">Exibir quando você respondeu cada pergunta</p>
						</div>
						<Switch checked={showAnswerDate} onCheckedChange={setShowAnswerDate} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar total de seguidores publicamente</Label>
							<p className="text-sm text-gray-500">Exibir o número de seguidores no seu perfil</p>
						</div>
						<Switch checked={showFollowersCount} onCheckedChange={setShowFollowersCount} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar total de perguntas enviadas publicamente</Label>
							<p className="text-sm text-gray-500">Exibir o número total de perguntas que você enviou</p>
						</div>
						<Switch checked={showTotalQuestionSent} onCheckedChange={setShowQuestionsSent} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar total de curtidas nas respostas individuais publicamente</Label>
							<p className="text-sm text-gray-500">Exibir curtidas em cada resposta individual</p>
						</div>
						<Switch checked={showIndividualLikes} onCheckedChange={setShowIndividualLikes} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar total de descurtidas nas respostas individuais publicamente</Label>
							<p className="text-sm text-gray-500">Exibir descurtidas em cada resposta individual</p>
						</div>
						<Switch checked={showIndividualDislikes} onCheckedChange={setShowIndividualDislikes} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar total de curtidas em todas suas respostas publicamente</Label>
							<p className="text-sm text-gray-500">
								Exibir o número total de curtidas em todas as respostas que você já respondeu
							</p>
						</div>
						<Switch checked={showTotalLikes} onCheckedChange={setShowTotalLikes} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar total de perguntas que você já recebeu publicamente</Label>
							<p className="text-sm text-gray-500">Exibir o número total de perguntas que você recebeu</p>
						</div>
						<Switch checked={showTotalQuestionsReceived} onCheckedChange={setShowTotalQuestionsReceived} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>Mostrar total de perguntas que você já respondeu publicamente</Label>
							<p className="text-sm text-gray-500">
								Exibir o número total de perguntas que você respondeu
							</p>
						</div>
						<Switch checked={showTotalQuestionsAnswered} onCheckedChange={setShowTotalQuestionsAnswered} />
					</div>

					<Button
						type="submit"
						disabled={isLoading}
						className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-800 hover:to-green-700 dark:from-gray-200 dark:to-gray-100 dark:hover:from-gray-300 dark:hover:to-gray-200 text-white dark:text-black"
					>
						{isLoading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Atualizando...
							</>
						) : (
							"Atualizar Configurações de Privacidade"
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
