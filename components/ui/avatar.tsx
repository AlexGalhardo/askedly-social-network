"use client";

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Avatar({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Root> & { className?: string }): React.ReactElement {
	return (
		<AvatarPrimitive.Root
			className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}
			{...props}
		/>
	);
}

function AvatarImage({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Image> & { className?: string }): React.ReactElement {
	return <AvatarPrimitive.Image className={cn("aspect-square h-full w-full", className)} {...props} />;
}

function AvatarFallback({
	className,
	...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback> & { className?: string }): React.ReactElement {
	return (
		<AvatarPrimitive.Fallback
			className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}
			{...props}
		/>
	);
}

export { Avatar, AvatarFallback, AvatarImage };
