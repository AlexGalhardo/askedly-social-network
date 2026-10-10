"use client";

import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import ChangePasswordComponent from "./change-password";

export default function ChangePasswordPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<ChangePasswordComponent />
			</Suspense>
		</div>
	);
}
