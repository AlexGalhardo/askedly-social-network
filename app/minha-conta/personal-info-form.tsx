// components/account/personal-info-form.tsx
"use client";

import { Loader2, Upload } from "lucide-react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUpdatePersonalInfo } from "@/hooks/use-account-mutations";
import { useToast } from "@/hooks/use-toast";
import { UploadButton } from "@/lib/uploadthing";

interface PersonalInfoFormProps {
	user: {
		avatar_url?: string;
		name: string;
		nickname: string;
		email: string;
		website?: string;
		description?: string;
	};
}

export function PersonalInfoForm({ user }: any) {
	const { toast } = useToast();
	const [isPending, startTransition] = useTransition();
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
				<CardTitle>Informações Pessoais</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="avatar">Avatar</Label>
						<div className="flex items-center gap-4">
							<div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
								{avatarUrl ? (
									<img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
								) : (
									<Upload className="h-6 w-6 text-gray-500" />
								)}
							</div>
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
										title: "Avatar atualizado com sucesso!",
										variant: "success",
									});
								}}
								onUploadError={(error: Error) => {
									setErrorUploadAvatarUrl(
										"Ocorreu um erro ao fazer o upload da imagem. Por favor, tente novamente.",
									);
								}}
							/>
							{errorUploadAvatarUrl && <p className="font-bold text-red-600">{errorUploadAvatarUrl}</p>}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="name">
							Nome <small className="text-gray-400">(obrigatório)</small>
						</Label>
						<Input
							id="name"
							name="name"
							type="text"
							maxLength={32}
							minLength={4}
							placeholder="Seu Nome Completo"
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
						<p className="text-sm text-gray-500">Entre 4 e 24 caracteres</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="nickname">Nickname</Label>
						<Input
							id="nickname"
							value={`@${user.nickname}`}
							disabled
							className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						/>
						<p className="text-sm text-gray-500 dark:text-gray-400">O nickname não pode ser alterado</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							value={user.email}
							disabled
							className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
						/>
						<p className="text-sm text-gray-500 dark:text-gray-400">O email não pode ser alterado</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="website">
							Website <small className="text-gray-400">(opcional)</small>
						</Label>
						<Input
							id="website"
							name="website"
							value={website}
							onChange={(e) => setWebsite(e.target.value)}
							placeholder="https://seusite.com"
						/>
						<p className="text-sm text-gray-500">Deve começar com https://</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="description">
							Descrição do Meu Perfil <small className="text-gray-400">(opcional)</small>
						</Label>
						<Textarea
							id="description"
							name="description"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder="Conte um pouco sobre você..."
							className="min-h-[100px]"
						/>
						<div className="flex justify-between text-sm text-gray-500">
							<small>Mínimo: 32 caracteres | Máximo: 256 caracteres</small>
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
								Atualizando...
							</>
						) : (
							"Atualizar Informações Pessoais"
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
