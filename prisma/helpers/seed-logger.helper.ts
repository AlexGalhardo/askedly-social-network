export const SeedLogger = {
	info(message: string): void {
		console.log(`ℹ️ ${message}`);
	},

	success(message: string): void {
		console.log(`✅ ${message}`);
	},

	warning(message: string): void {
		console.log(`⚠️ ${message}`);
	},

	error(message: string): void {
		console.error(`❌ ${message}`);
	},

	progress(current: number, total: number, description: string): void {
		const percentage = Math.round((current / total) * 100);
		console.log(`🚀 ${description}: ${current}/${total} (${percentage}%)`);
	},

	separator(): void {
		console.log("=".repeat(60));
	},

	header(title: string): void {
		SeedLogger.separator();
		console.log(`📊 ${title}`);
		SeedLogger.separator();
	},
};
