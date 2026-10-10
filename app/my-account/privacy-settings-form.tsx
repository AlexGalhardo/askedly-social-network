"use client";

import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useUpdatePrivacySettings } from "@/hooks/use-account-mutations";

export function PrivacySettingsForm({ user }: any) {
	const [isPending, startTransition] = useTransition();
	const t = useTranslations("account");
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
				<CardTitle>{t("privacy.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={handleSubmit} className="space-y-6">
					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.privateProfile.label")}</Label>
							<p className="text-sm text-gray-500">
								{t.rich("privacy.privateProfile.description", { br: () => <br /> })}
							</p>
						</div>
						<Switch checked={isPrivateProfile} onCheckedChange={setIsPrivateProfile} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.acceptAnonymous.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.acceptAnonymous.description")}</p>
						</div>
						<Switch checked={acceptAnonymousQuestions} onCheckedChange={setAcceptAnonymousQuestions} />
					</div>

					{acceptAnonymousQuestions && (
						<div className="flex items-center justify-between pl-4 border-l-2 border-green-200">
							<div className="space-y-0.5">
								<Label>{t("privacy.showAnonymousPublic.label")}</Label>
								<p className="text-sm text-gray-500">{t("privacy.showAnonymousPublic.description")}</p>
							</div>
							<Switch
								checked={showQuestionsAnonymousAnsweredPublic}
								onCheckedChange={setShowQuestionsAnonymousAnsweredPublic}
							/>
						</div>
					)}

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.followersOnly.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.followersOnly.description")}</p>
						</div>
						<Switch
							checked={showAnsweredToFollowersOnly}
							onCheckedChange={setShowAnsweredToFollowersOnly}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showPaymentAmount.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showPaymentAmount.description")}</p>
						</div>
						<Switch
							checked={showPaymentAmountEachQuestion}
							onCheckedChange={setShowPaymentAmountEachQuestion}
						/>
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showAnswerDate.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showAnswerDate.description")}</p>
						</div>
						<Switch checked={showAnswerDate} onCheckedChange={setShowAnswerDate} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showFollowersCount.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showFollowersCount.description")}</p>
						</div>
						<Switch checked={showFollowersCount} onCheckedChange={setShowFollowersCount} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showQuestionsSent.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showQuestionsSent.description")}</p>
						</div>
						<Switch checked={showTotalQuestionSent} onCheckedChange={setShowQuestionsSent} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showIndividualLikes.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showIndividualLikes.description")}</p>
						</div>
						<Switch checked={showIndividualLikes} onCheckedChange={setShowIndividualLikes} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showIndividualDislikes.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showIndividualDislikes.description")}</p>
						</div>
						<Switch checked={showIndividualDislikes} onCheckedChange={setShowIndividualDislikes} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showTotalLikes.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showTotalLikes.description")}</p>
						</div>
						<Switch checked={showTotalLikes} onCheckedChange={setShowTotalLikes} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showQuestionsReceived.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showQuestionsReceived.description")}</p>
						</div>
						<Switch checked={showTotalQuestionsReceived} onCheckedChange={setShowTotalQuestionsReceived} />
					</div>

					<div className="flex items-center justify-between">
						<div className="space-y-0.5">
							<Label>{t("privacy.showQuestionsAnswered.label")}</Label>
							<p className="text-sm text-gray-500">{t("privacy.showQuestionsAnswered.description")}</p>
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
								{t("common.updating")}
							</>
						) : (
							t("privacy.submit")
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
