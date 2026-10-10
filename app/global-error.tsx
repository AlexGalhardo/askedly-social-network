"use client";

// Last resort: an error in the root layout itself. There is no locale provider or app CSS here, so the text is
// hardcoded in English (the default locale) and the styling is inline.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html lang="en">
			<body
				style={{
					fontFamily: "system-ui, sans-serif",
					display: "grid",
					placeItems: "center",
					minHeight: "100vh",
				}}
			>
				<main style={{ textAlign: "center", padding: 24 }}>
					<h1>Something went wrong</h1>
					<p>Please try again.</p>
					<button type="button" onClick={reset} style={{ padding: "8px 16px", cursor: "pointer" }}>
						Try again
					</button>
				</main>
			</body>
		</html>
	);
}
