export const SeedEnvironment = {
	getTotalUsers(): number {
		return Number(process.env.SEED_TOTAL_RANDOM_USERS_TO_CREATED) || 100000;
	},

	getTotalFollowers(): number {
		return Number(process.env.SEED_TOTAL_FOLLOWERS_RELATIONS) || 500000;
	},

	getTotalQuestions(): number {
		return Number(process.env.SEED_RANDOM_QUESTIONS_TO_CREATE) || 50000;
	},

	getConfig() {
		return {
			totalUsers: SeedEnvironment.getTotalUsers(),
			totalFollowers: SeedEnvironment.getTotalFollowers(),
			totalQuestions: SeedEnvironment.getTotalQuestions(),
		};
	},
};
