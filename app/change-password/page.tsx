"use client";

import { Suspense } from "react";
import LoadingScreen from "@/components/loading-screen";
import ResetarSenhaComponent from "./change-password";

export default function ResetarSenhaPage() {
	return (
		<div>
			<Suspense fallback={<LoadingScreen />}>
				<ResetarSenhaComponent />
			</Suspense>
		</div>
	);
}
