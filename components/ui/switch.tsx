"use client";

import { Switch as SwitchPrimitive } from "@base-ui/react/switch";
import type * as React from "react";

import { cn } from "@/lib/utils";

function Switch({
	className,
	...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & { className?: string }): React.ReactElement {
	return (
		<SwitchPrimitive.Root
			// <button> nativo: o `id` fica no controle visível, então `<Label htmlFor>` e seletores por id continuam valendo.
			nativeButton
			render={<button type="button" />}
			className={cn(
				"peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 data-[checked]:bg-primary data-[unchecked]:bg-input",
				className,
			)}
			{...props}
		>
			<SwitchPrimitive.Thumb className="pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[checked]:translate-x-5 data-[unchecked]:translate-x-0" />
		</SwitchPrimitive.Root>
	);
}

export { Switch };
