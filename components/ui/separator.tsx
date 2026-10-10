"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Separator({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: React.ComponentProps<typeof SeparatorPrimitive> & { className?: string; decorative?: boolean }): React.ReactElement {
	return (
		<SeparatorPrimitive
			orientation={orientation}
			// Base UI always exposes `role="separator"`; the decorative one (default) stays out of the accessibility tree.
			{...(decorative && { role: "none", "aria-orientation": undefined })}
			className={cn(
				"shrink-0 bg-border",
				orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
				className,
			)}
			{...props}
		/>
	);
}

export { Separator };
