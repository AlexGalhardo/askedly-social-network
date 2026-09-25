"use server";

import { type SignupResult, signUp as signUpUser } from "@/lib/services/signup.service";

export async function signUp(input: unknown): Promise<SignupResult> {
	return signUpUser(input);
}
