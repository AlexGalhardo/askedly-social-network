export class SeedLogger {
	static info(message: string): void {
		console.log(`ℹ️ ${message}`);
	}

	static success(message: string): void {
		console.log(`✅ ${message}`);
	}

	static warning(message: string): void {
		console.log(`⚠️ ${message}`);
	}

	static error(message: string): void {
		console.error(`❌ ${message}`);
	}

	static progress(current: number, total: number, description: string): void {
		const percentage = Math.round((current / total) * 100);
		console.log(`🚀 ${description}: ${current}/${total} (${percentage}%)`);
	}

	static separator(): void {
		console.log("=".repeat(60));
	}

	static header(title: string): void {
		this.separator();
		console.log(`📊 ${title}`);
		this.separator();
	}
}
