// components/account/social-media-form.tsx
"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useUpdateSocialMedia } from "@/hooks/use-account-mutations";

interface SocialMediaFormProps {
	user: {
		instagram?: string;
		facebook?: string;
		youtube?: string;
		twitter?: string;
		tiktok?: string;
		linkedin?: string;
		twitch?: string;
	};
}

export function SocialMediaForm({ user }: any) {
	const [isPending, startTransition] = useTransition();
	const updateSocialMediaMutation = useUpdateSocialMedia();

	const [instagram, setInstagram] = useState(user.instagram || "");
	const [facebook, setFacebook] = useState(user.facebook || "");
	const [youtube, setYoutube] = useState(user.youtube || "");
	const [twitter, setTwitter] = useState(user.twitter || "");
	const [tiktok, setTiktok] = useState(user.tiktok || "");
	const [linkedin, setLinkedin] = useState(user.linkedin || "");
	const [twitch, setTwitch] = useState(user.twitch || "");

	const handleSubmit = (formData: FormData) => {
		startTransition(() => {
			updateSocialMediaMutation.mutate(formData);
		});
	};

	const isLoading = isPending || updateSocialMediaMutation.isPending;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Redes Sociais</CardTitle>
			</CardHeader>
			<CardContent>
				<form action={handleSubmit} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="instagram">
							Instagram <small className="text-gray-400">(opcional)</small>
						</Label>
						<Input
							id="instagram"
							name="instagram"
							minLength={1}
							maxLength={30}
							placeholder="seuusuario"
							value={instagram.replace("https://instagram.com/", "")}
							onChange={(e) => {
								const raw = e.target.value;
								const sanitized = raw
									.toLowerCase()
									.replace(/[^a-z0-9._]/g, "")
									.replace(/\.+$/, "");
								setInstagram(`https://instagram.com/${sanitized}`);
							}}
						/>
						<p className="text-sm text-gray-500">{instagram || "https://instagram.com/seuusuario"}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="facebook">
							Facebook <small className="text-gray-400">(opcional)</small>
						</Label>
						<Input
							id="facebook"
							name="facebook"
							minLength={5}
							maxLength={50}
							placeholder="seuusuario"
							value={facebook.replace("https://facebook.com/", "")}
							onChange={(e) => {
								const raw = e.target.value;
								const sanitized = raw.toLowerCase().replace(/[^a-z0-9.]/g, "");
								setFacebook(`https://facebook.com/${sanitized}`);
							}}
						/>
						<p className="text-sm text-gray-500">{facebook || "https://facebook.com/seuusuario"}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="youtube">
							YouTube <small className="text-gray-400">(opcional)</small>
						</Label>
						<Input
							id="youtube"
							name="youtube"
							minLength={3}
							maxLength={30}
							placeholder="@seucanal"
							value={youtube.replace("https://youtube.com/@", "")}
							onChange={(e) => {
								const raw = e.target.value;
								const sanitized = raw.toLowerCase().replace(/[^a-z0-9._-]/g, "");
								setYoutube(`https://youtube.com/@${sanitized}`);
							}}
						/>
						<p className="text-sm text-gray-500">{youtube || "https://youtube.com/@seucanal"}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="twitter">
							Twitter <small className="text-gray-400">(opcional)</small>
						</Label>
						<Input
							id="twitter"
							name="twitter"
							minLength={4}
							maxLength={15}
							placeholder="seuusuario"
							value={twitter.replace("https://twitter.com/", "")}
							onChange={(e) => {
								const raw = e.target.value;
								const sanitized = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
								setTwitter(`https://twitter.com/${sanitized}`);
							}}
						/>
						<p className="text-sm text-gray-500">{twitter || "https://twitter.com/seuusuario"}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="tiktok">
							TikTok <small className="text-gray-400">(opcional)</small>
						</Label>
						<Input
							id="tiktok"
							name="tiktok"
							minLength={2}
							maxLength={24}
							placeholder="@seuusuario"
							value={tiktok.replace("https://tiktok.com/@", "")}
							onChange={(e) => {
								const raw = e.target.value;
								const sanitized = raw
									.toLowerCase()
									.replace(/[^a-z0-9._]/g, "")
									.replace(/^[^a-z0-9]+/, "");
								setTiktok(`https://tiktok.com/@${sanitized}`);
							}}
						/>
						<p className="text-sm text-gray-500">{tiktok || "https://tiktok.com/@seuusuario"}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="linkedin">
							LinkedIn <small className="text-gray-400">(opcional)</small>
						</Label>
						<Input
							id="linkedin"
							name="linkedin"
							minLength={5}
							maxLength={30}
							placeholder="seuusuario"
							value={linkedin.replace("https://linkedin.com/in/", "")}
							onChange={(e) => {
								const raw = e.target.value;
								let sanitized = raw.toLowerCase().replace(/[^a-z0-9-]/g, "");
								sanitized = sanitized.replace(/^-+|-+$/g, "");
								setLinkedin(`https://linkedin.com/in/${sanitized}`);
							}}
						/>
						<p className="text-sm text-gray-500">{linkedin || "https://linkedin.com/in/seuusuario"}</p>
					</div>

					<div className="space-y-2">
						<Label htmlFor="twitch">
							Twitch <small className="text-gray-400">(opcional)</small>
						</Label>
						<Input
							id="twitch"
							name="twitch"
							minLength={4}
							maxLength={25}
							placeholder="seuusuario"
							value={twitch.replace("https://twitch.tv/", "")}
							onChange={(e) => {
								const raw = e.target.value;
								const sanitized = raw
									.toLowerCase()
									.replace(/[^a-z0-9_]/g, "")
									.replace(/^[0-9]+/, "");
								setTwitch(`https://twitch.tv/${sanitized}`);
							}}
						/>
						<p className="text-sm text-gray-500">{twitch || "https://twitch.tv/seuusuario"}</p>
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
							"Atualizar Redes Sociais"
						)}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
