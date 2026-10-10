import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface SessionUser {
	id: string;
	nickname: string;
}

/** Authenticated user of the current request. Routes and Server Actions must use this, never ids/nicknames from the body. */
export async function getSessionUser(): Promise<SessionUser | null> {
	const session = await getServerSession(authOptions);
	const user = session?.user;
	return user?.id && user.nickname ? { id: user.id, nickname: user.nickname } : null;
}
