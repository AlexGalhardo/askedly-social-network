import { NextResponse } from "next/server";

export async function GET() {
	const isDangerMode = process.env.DANGER_MODE === "true";

	return NextResponse.json(
		{
			status: isDangerMode ? "offline" : "ok",
			timestamp: new Date().toISOString(),
			offline: isDangerMode,
		},
		{
			status: isDangerMode ? 503 : 200,
		},
	);
}
