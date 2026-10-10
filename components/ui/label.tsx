import type * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">): React.ReactElement {
	return (
		// biome-ignore lint/a11y/noLabelWithoutControl: componente genérico; quem usa passa `htmlFor` ou o controle como filho
		<label
			className={cn(
				"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 peer-data-[disabled]:cursor-not-allowed peer-data-[disabled]:opacity-70",
				className,
			)}
			{...props}
		/>
	);
}

export { Label };
