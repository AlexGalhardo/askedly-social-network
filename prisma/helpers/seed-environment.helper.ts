export class SeedEnvironment {
	static getTotalUsers(): number {
		return Number(process.env.SEED_TOTAL_RANDOM_USERS_TO_CREATED) || 100000;
	}

	static getTotalFollowers(): number {
		return Number(process.env.SEED_TOTAL_FOLLOWERS_RELATIONS) || 500000;
	}

	static getTotalQuestions(): number {
		return Number(process.env.SEED_RANDOM_QUESTIONS_TO_CREATE) || 50000;
	}

	static getConfig() {
		return {
			totalUsers: this.getTotalUsers(),
			totalFollowers: this.getTotalFollowers(),
			totalQuestions: this.getTotalQuestions(),
		};
	}
}
