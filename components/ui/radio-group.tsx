"use client";

import { Radio } from "@base-ui/react/radio";
import { RadioGroup as RadioGroupPrimitive } from "@base-ui/react/radio-group";
import { Circle } from "lucide-react";
import type * as React from "react";

import { cn } from "@/lib/utils";

function RadioGroup({ className, ...props }: RadioGroupPrimitive.Props & { className?: string }): React.ReactElement {
	return <RadioGroupPrimitive className={cn("grid gap-2", className)} {...props} />;
}

function RadioGroupItem({
	className,
	...props
}: React.ComponentProps<typeof Radio.Root> & { className?: string }): React.ReactElement {
	return (
		<Radio.Root
			// <button> nativo: o `id` fica no controle visível, então `<Label htmlFor>` e seletores por id continuam valendo.
			nativeButton
			render={<button type="button" />}
			className={cn(
				"aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
				className,
			)}
			{...props}
		>
			<Radio.Indicator className="flex items-center justify-center">
				<Circle className="h-2.5 w-2.5 fill-current text-current" />
			</Radio.Indicator>
		</Radio.Root>
	);
}

export { RadioGroup, RadioGroupItem };
