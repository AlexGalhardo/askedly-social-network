/** Official icon: a speech bubble with a question mark. The same artwork is the favicon (app/icon.svg). */
export function AskedlyLogo({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 64 64" fill="none" className={className}>
			<title>Askedly</title>
			<rect width="64" height="64" rx="14" fill="#16a34a" />
			<path
				d="M14 18a6 6 0 0 1 6-6h24a6 6 0 0 1 6 6v18a6 6 0 0 1-6 6H31l-9 8v-8h-2a6 6 0 0 1-6-6V18Z"
				fill="#fff"
			/>
			<path
				d="M26.5 22.5a5.5 5.5 0 1 1 7.6 5.1c-1.3.6-2.1 1.5-2.1 2.9"
				stroke="#16a34a"
				strokeWidth="3.5"
				strokeLinecap="round"
			/>
			<circle cx="32" cy="35.5" r="2.2" fill="#16a34a" />
		</svg>
	);
}
