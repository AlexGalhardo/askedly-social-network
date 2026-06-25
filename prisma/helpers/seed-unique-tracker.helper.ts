export class SeedUniqueTracker {
	private readonly usedNicknames = new Set<string>();
	private readonly usedEmails = new Set<string>();
	private readonly usedAvatars = new Set<string>();
	private readonly followRelations = new Set<string>();

	isNicknameUsed(nickname: string): boolean {
		return this.usedNicknames.has(nickname);
	}

	isEmailUsed(email: string): boolean {
		return this.usedEmails.has(email);
	}

	isAvatarUsed(avatar: string): boolean {
		return this.usedAvatars.has(avatar);
	}

	isFollowRelationUsed(followerId: string, followingId: string): boolean {
		const relationKey = `${followerId}-${followingId}`;
		return this.followRelations.has(relationKey);
	}

	addNickname(nickname: string): void {
		this.usedNicknames.add(nickname);
	}

	addEmail(email: string): void {
		this.usedEmails.add(email);
	}

	addAvatar(avatar: string): void {
		this.usedAvatars.add(avatar);
	}

	addFollowRelation(followerId: string, followingId: string): void {
		const relationKey = `${followerId}-${followingId}`;
		this.followRelations.add(relationKey);
	}

	getStats() {
		return {
			nicknames: this.usedNicknames.size,
			emails: this.usedEmails.size,
			avatars: this.usedAvatars.size,
			relations: this.followRelations.size,
		};
	}
}
