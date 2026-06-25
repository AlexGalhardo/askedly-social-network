"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSessionVerification } from "@/hooks/use-session-verification";
import LoadingScreen from "@/components/loading-screen";
import BlockedUsersCard from "./blocked-users-card";
import { PersonalInfoForm } from "./personal-info-form";
import { PixForm } from "./pix-form";
import { SocialMediaForm } from "./social-media-form";
import { PasswordForm } from "./password-form";
import { PrivacySettingsForm } from "./privacy-settings-form";
import { DeleteAccountForm } from "./delete-account-form";

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
