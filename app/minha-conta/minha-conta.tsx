"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoadingScreen from "@/components/loading-screen";
import { useSessionVerification } from "@/hooks/use-session-verification";
import BlockedUsersCard from "./blocked-users-card";
import { DeleteAccountForm } from "./delete-account-form";
import { PasswordForm } from "./password-form";
import { PersonalInfoForm } from "./personal-info-form";
import { PixForm } from "./pix-form";
import { PrivacySettingsForm } from "./privacy-settings-form";
import { SocialMediaForm } from "./social-media-form";

export default function MinhaContaClient() {
	const router = useRouter();
	const { session, isAuthenticated, isLoading } = useSessionVerification();

	useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			router.push("/entrar");
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading) {
		return <LoadingScreen />;
	}

	if (!isAuthenticated || !session?.user) {
		return null;
	}

	return (
		<main className="p-4 lg:p-6">
			<div className="space-y-6">
				<PersonalInfoForm user={session.user} />
				<PixForm initialPixKey={session.user.pix_key} />
				<SocialMediaForm user={session.user} />
				<PasswordForm />
				<PrivacySettingsForm user={session.user} />
				<BlockedUsersCard />
				<DeleteAccountForm />
			</div>
		</main>
	);
}
