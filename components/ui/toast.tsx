"use client";

import { Toast as ToastPrimitive } from "@base-ui/react/toast";
import { cva, type VariantProps } from "class-variance-authority";
import { X } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

const ToastProvider = ToastPrimitive.Provider;

function ToastViewport({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport> & { className?: string }): React.ReactElement {
	return (
		<ToastPrimitive.Portal>
			<ToastPrimitive.Viewport
				className={cn(
					"fixed right-4 top-4 z-[100] w-[calc(100%-2rem)] sm:bottom-4 sm:top-auto md:max-w-[388px]",
					className,
				)}
				{...props}
			/>
		</ToastPrimitive.Portal>
	);
}

// Toasts are stacked (absolute) so the incoming one does not push the outgoing one.
const toastVariants = cva(
	"group pointer-events-auto absolute right-0 top-0 z-[calc(10-var(--toast-index))] w-full overflow-hidden rounded-md border shadow-lg [transform:translateX(var(--toast-swipe-movement-x))] [transition:transform_0.3s,opacity_0.3s] data-[swiping]:transition-none data-[starting-style]:opacity-0 data-[starting-style]:[transform:translateY(-100%)] data-[ending-style]:opacity-0 data-[ending-style]:[transform:translateX(calc(var(--toast-swipe-movement-x)+100%))] sm:bottom-0 sm:top-auto sm:data-[starting-style]:[transform:translateY(100%)]",
	{
		variants: {
			variant: {
				default: "border bg-background text-foreground",
				success: "border border-emerald-500 bg-emerald-500 text-white",
				warning: "border border-yellow-500 bg-yellow-500 text-black",
				error: "destructive group border-destructive bg-destructive text-destructive-foreground",
			},
		},
		defaultVariants: {
			variant: "success",
		},
	},
);

type ToastVariant = NonNullable<VariantProps<typeof toastVariants>["variant"]>;

type ToastActionElement = React.ReactElement<React.ComponentProps<typeof ToastAction>>;

interface ToastData {
	variant?: ToastVariant;
	className?: string;
	action?: ToastActionElement;
}

type ToastProps = React.ComponentProps<typeof ToastPrimitive.Root> & { className?: string; variant?: ToastVariant };

function Toast({ className, variant, children, ...props }: ToastProps): React.ReactElement {
	return (
		<ToastPrimitive.Root swipeDirection="right" className={cn(toastVariants({ variant }), className)} {...props}>
			<ToastPrimitive.Content className="flex w-full items-center justify-between space-x-4 p-6 pr-8">
				{children}
			</ToastPrimitive.Content>
		</ToastPrimitive.Root>
	);
}

function ToastAction({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitive.Action> & { className?: string }): React.ReactElement {
	return (
		<ToastPrimitive.Action
			className={cn(
				"inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
				className,
			)}
			{...props}
		/>
	);
}

function ToastClose({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitive.Close> & { className?: string }): React.ReactElement {
	return (
		<ToastPrimitive.Close
			className={cn(
				"absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
				className,
			)}
			{...props}
		>
			<X className="h-4 w-4" />
		</ToastPrimitive.Close>
	);
}

function ToastTitle({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitive.Title> & { className?: string }): React.ReactElement {
	return <ToastPrimitive.Title className={cn("text-sm font-semibold", className)} {...props} />;
}

function ToastDescription({
	className,
	...props
}: React.ComponentProps<typeof ToastPrimitive.Description> & { className?: string }): React.ReactElement {
	return <ToastPrimitive.Description className={cn("text-sm opacity-90", className)} {...props} />;
}

export {
	Toast,
	ToastAction,
	type ToastActionElement,
	ToastClose,
	type ToastData,
	ToastDescription,
	type ToastProps,
	ToastProvider,
	ToastTitle,
	type ToastVariant,
	ToastViewport,
};
