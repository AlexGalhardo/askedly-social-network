type RateLimitRecord = {
	count: number;
	resetAt: number;
};

export class RateLimiter {
	private readonly store: Map<string, RateLimitRecord>;
	private readonly maxRequests: number;
	private readonly windowMs: number;

	constructor(maxRequests: number, windowMs: number) {
		this.store = new Map();
		this.maxRequests = maxRequests;
		this.windowMs = windowMs;
	}

	async check(key: string): Promise<{ success: boolean; remaining: number; resetAt: number }> {
		const now = Date.now();

		this.cleanExpired();

		let record = this.store.get(key);

		if (!record) {
			record = {
				count: 0,
				resetAt: now + this.windowMs,
			};
			this.store.set(key, record);
		}

		if (now > record.resetAt) {
			record.count = 0;
			record.resetAt = now + this.windowMs;
		}

		record.count += 1;

		const success = record.count <= this.maxRequests;
		const remaining = Math.max(0, this.maxRequests - record.count);

		return {
			success,
			remaining,
			resetAt: record.resetAt,
		};
	}

	private cleanExpired(): void {
		const now = Date.now();
		for (const [key, record] of this.store.entries()) {
			if (now > record.resetAt) {
				this.store.delete(key);
			}
		}
	}
}
