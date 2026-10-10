"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type * as React from "react";
import {
	Toast,
	ToastClose,
	type ToastData,
	ToastDescription,
	ToastProvider,
	ToastTitle,
	ToastViewport,
} from "@/components/ui/toast";
import { toastManager } from "@/hooks/use-toast";

function ToastList(): React.ReactNode {
	const { toasts } = ToastPrimitive.useToastManager<ToastData>();

	return toasts.map((toast) => (
		<Toast key={toast.id} toast={toast} variant={toast.data?.variant} className={toast.data?.className}>
			<div className="grid gap-1">
				<ToastTitle />
				<ToastDescription />
			</div>
			{toast.data?.action}
			<ToastClose />
		</Toast>
	));
}

export function Toaster(): React.ReactElement {
	return (
		<ToastProvider toastManager={toastManager}>
			<ToastViewport>
				<ToastList />
			</ToastViewport>
		</ToastProvider>
	);
}
