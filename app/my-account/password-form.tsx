"use client";

import { Check, Loader2, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { type FormEvent, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdatePassword } from "@/hooks/use-account-mutations";

const CriteriaItem = ({ met, text }: { met: boolean; text: string }) => (
	<div className="flex items-center space-x-2">
		{met ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
		<span className={`text-sm ${met ? "text-green-500" : "text-gray-400"}`}>{text}</span>
	</div>
);

export function PasswordForm() {
	const [isPending, startTransition] = useTransition();
	const t = useTranslations("account");
	const tc = useTranslations("auth.passwordCriteria");
	const updatePasswordMutation = useUpdatePassword();
	const { data: session } = useSession();
	const hasPassword = session?.user?.has_password ?? true;

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPasswordCriteria, setShowPasswordCriteria] = useState(false);
	const [passwordCriteria, setPasswordCriteria] = useState({
		length: false,
		uppercase: false,
		lowercase: false,
		number: false,
		special: false,
	});

	useEffect(() => {
		if (newPassword.length > 0) {
			setPasswordCriteria({
				length: newPassword.length >= 8,
				uppercase: /[A-Z]/.test(newPassword),
				lowercase: /[a-z]/.test(newPassword),
				number: /[0-9]/.test(newPassword),
				special: /[^A-Za-z0-9]/.test(newPassword),
			});
		} else {
			setPasswordCriteria({
				length: false,
				uppercase: false,
				lowercase: false,
				number: false,
				special: false,
			});
		}
	}, [newPassword]);

	// onSubmit instead of <form action>: React resets the form DOM after an action, so on a wrong current
	// password the fields would vanish from the screen even though state still holds them.
	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startTransition(() => {
			updatePasswordMutation.mutate(formData, {
				onSuccess: (data) => {
					if (!data.error) {
						// Changing the password revokes every session, including this one: log in again with the new password.
						signOut({ callbackUrl: "/login?password-changed=1" });
						setCurrentPassword("");
						setNewPassword("");
						setConfirmPassword("");
						setShowPasswordCriteria(false);
					}
				},
			});
		});
	};

	const isLoading = isPending || updatePasswordMutation.isPending;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("password.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-4">
					{hasPassword ? (
						<div className="space-y-2">
							<Label htmlFor="current-password">{t("password.current")}</Label>
							<Input
								id="current-password"
								name="currentPassword"
								type="password"
								autoComplete="current-password"
								value={currentPassword}
								onChange={(e) => setCurrentPassword(e.target.value)}
								required
							/>
						</div>
					) : (
						<p className="text-sm text-gray-600">{t("password.googleNotice")}</p>
					)}

					<div className="space-y-2">
						<Label htmlFor="new-password">{t("password.new")}</Label>
						<Input
							id="new-password"
							name="newPassword"
							type="password"
							value={newPassword}
							onChange={(e) => {
								const value = e.target.value;
								setNewPassword(value);
								setShowPasswordCriteria(value.length > 0);
							}}
							placeholder={t("password.newPlaceholder")}
							required
						/>
					</div>

					{showPasswordCriteria && (
						<div className="rounded-md px-3">
							<p className="text-sm text-gray-600 mb-2">{tc("title")}</p>
							<div className="space-y-1">
								<CriteriaItem met={passwordCriteria.length} text={tc("length")} />
								<CriteriaItem met={passwordCriteria.uppercase} text={tc("uppercase")} />
								<CriteriaItem met={passwordCriteria.lowercase} text={tc("lowercase")} />
								<CriteriaItem met={passwordCriteria.number} text={tc("number")} />
								<CriteriaItem met={passwordCriteria.special} text={tc("special")} />
							</div>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="confirm-password">{t("password.confirm")}</Label>
						<Input
							id="confirm-password"
							name="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder={t("password.confirmPlaceholder")}
							required
						/>
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
							t("password.submit")
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
