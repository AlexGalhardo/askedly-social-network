"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import type * as React from "react";

import type { ToastData } from "@/components/ui/toast";

// Global manager: lets `toast()` be called outside the React tree. The `Toaster` hands it to the provider.
const toastManager = ToastPrimitive.createToastManager<ToastData>();

interface ToastOptions extends ToastData {
	title?: React.ReactNode;
	description?: React.ReactNode;
	duration?: number;
}

function toast({ title, description, duration, ...data }: ToastOptions): { id: string; dismiss: () => void } {
	// One toast at a time, as before: the new one replaces whatever is on screen.
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
