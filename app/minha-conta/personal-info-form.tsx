"use client";

import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { type ReactNode, useState, useTransition } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdatePersonalInfo } from "@/hooks/use-account-mutations";
import { useToast } from "@/hooks/use-toast";
import { UploadButton } from "@/lib/uploadthing";

const hint = (chunks: ReactNode) => <small className="text-gray-400">{chunks}</small>;

export function PersonalInfoForm({ user }: any) {
	const { toast } = useToast();
	const [isPending, startTransition] = useTransition();
	const t = useTranslations("account");
	const updatePersonalInfoMutation = useUpdatePersonalInfo();

	const [avatarUrl, setAvatarUrl] = useState(user.avatar_url || "");
	const [name, setName] = useState(user.name || "");
	const [website, setWebsite] = useState(user.website || "");
	const [description, setDescription] = useState(user.description || "");
	const [errorUploadAvatarUrl, setErrorUploadAvatarUrl] = useState("");

	const handleSubmit = (formData: FormData) => {
		startTransition(() => {
			updatePersonalInfoMutation.mutate(formData);
		});
	};

	const isLoading = isPending || updatePersonalInfoMutation.isPending;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{t("personalInfo.title")}</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="avatar">{t("personalInfo.avatar")}</Label>
						<div className="flex items-center gap-4">
							<Avatar className="h-16 w-16">
								<AvatarImage src={avatarUrl || undefined} alt={t("personalInfo.avatar")} />
								<AvatarFallback className="bg-gray-200">
									<Upload className="h-6 w-6 text-gray-500" />
								</AvatarFallback>
							</Avatar>
							<UploadButton
								appearance={{
									button: "ut-ready:bg-green-500 ut-uploading:cursor-not-allowed rounded-r-none bg-green-500 bg-none after:bg-orange-400",
									container: "w-max flex-row rounded-md border-cyan-300",
									allowedContent: "flex h-8 flex-col items-center justify-center px-2 text-black",
								}}
								endpoint="imageUploader"
								onClientUploadComplete={(res) => {
									setAvatarUrl(res[0]?.serverData.avatar_url as string);
									setErrorUploadAvatarUrl("");
									toast({
										title: t("personalInfo.avatarUpdated"),
										variant: "success",
									});
								}}
								onUploadError={(_error: Error) => {
									setErrorUploadAvatarUrl(t("personalInfo.avatarUploadError"));
								}}
							/>
							{errorUploadAvatarUrl && <p className="font-bold text-red-600">{errorUploadAvatarUrl}</p>}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="name">{t.rich("personalInfo.nameLabel", { hint })}</Label>
						<Input
							id="name"
							name="name"
							type="text"
							maxLength={32}
							minLength={4}
							placeholder={t("personalInfo.namePlaceholder")}
							value={name}
							onChange={(e) => {
								const capitalizedName = e.target.value
									.split(" ")
									.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
									.join(" ");
								setName(capitalizedName);
							}}
							required
						/>
						<p className="text-sm text-gray-500">{t("personalInfo.nameHelp")}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="nickname">{t("personalInfo.nickname")}</Label>
						<Input
							id="nickname"
							value={`@${user.nickname}`}
							disabled
							className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						/>
						<p className="text-sm text-gray-500 dark:text-gray-400">{t("personalInfo.nicknameHelp")}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">{t("personalInfo.email")}</Label>
						<Input
							id="email"
							value={user.email}
							disabled
							className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						/>
						<p className="text-sm text-gray-500 dark:text-gray-400">{t("personalInfo.emailHelp")}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="website">{t.rich("personalInfo.websiteLabel", { hint })}</Label>
						<Input
							id="website"
							name="website"
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
							placeholder={t("personalInfo.websitePlaceholder")}
						/>
						<p className="text-sm text-gray-500">{t("personalInfo.websiteHelp")}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">{t.rich("personalInfo.descriptionLabel", { hint })}</Label>
						<Textarea
							id="description"
							name="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t("personalInfo.descriptionPlaceholder")}
							className="min-h-[100px]"
						/>
						<div className="flex justify-between text-sm text-gray-500">
							<small>{t("personalInfo.descriptionHelp")}</small>
							<small
								className={
									description.length > 256
										? "text-red-500"
										: description.length > 0 && description.length < 32
											? "text-orange-500"
											: ""
								}
							>
								{description.length}/256
							</small>
						</div>
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
							t("personalInfo.submit")
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
