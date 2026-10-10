"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type * as React from "react";

import type { ToastData } from "@/components/ui/toast";

// Gerenciador global: permite chamar `toast()` fora da árvore React. O `Toaster` o entrega ao provider.
const toastManager = ToastPrimitive.createToastManager<ToastData>();

interface ToastOptions extends ToastData {
	title?: React.ReactNode;
	description?: React.ReactNode;
	duration?: number;
}

function toast({ title, description, duration, ...data }: ToastOptions): { id: string; dismiss: () => void } {
	// Um toast por vez, como antes: o novo substitui o que estiver na tela.
	toastManager.close();

	const id = toastManager.add({
		title,
		description,
		timeout: duration,
		type: data.variant,
		priority: data.variant === "error" ? "high" : "low",
		data,
	});

	return { id, dismiss: () => toastManager.close(id) };
}

function useToast(): { toast: typeof toast; dismiss: (toastId?: string) => void } {
	return { toast, dismiss: (toastId) => toastManager.close(toastId) };
}

export { toast, toastManager, useToast };
