import crypto from "node:crypto";
import { faker } from "@faker-js/faker";

export const SeedHelpers = {
	generatePixId(): string {
		return `pix_char_${crypto.randomUUID().replace(/-/g, "")}`;
	},

	generateApiKey(): string {
		return `api_key_askedly_${faker.string.alphanumeric(16)}`;
	},

	generateCreatedAt(): Date {
		const rand = Math.random() * 100;

		if (rand < 0.33) {
			return new Date();
		} else if (rand < 0.66) {
			return faker.date.recent();
		} else {
			return faker.date.past();
		}
	},

	generateAnsweredAtAfter(createdAt: Date): Date {
		const min = 1 * 60 * 1000;
		const max = 6 * 24 * 60 * 60 * 1000;
		const offset = faker.number.int({ min, max });
		return new Date(createdAt.getTime() + offset);
	},

	generateRandomAmount(): number {
		return faker.number.int({ min: 2, max: 50 }) * 100;
	},

	calculateFee(amount: number): number {
		return Math.floor(amount * 0.5);
	},

	generateSocialMediaUrl(platform: string, nickname: string): string | null {
		if (!faker.datatype.boolean({ probability: 0 })) return null;

		const urls = {
			twitter: `https://twitter.com/${nickname}`,
			instagram: `https://instagram.com/${nickname}`,
			youtube: `https://youtube.com/@${nickname}`,
			tiktok: `https://tiktok.com/@${nickname}`,
			linkedin: `https://linkedin.com/in/${nickname}`,
			github: `https://github.com/${nickname}`,
			facebook: `https://facebook.com/${nickname}`,
			twitch: `https://twitch.tv/${nickname}`,
		};

		return urls[platform as keyof typeof urls] || null;
	},

	shouldDelete(): boolean {
		return faker.datatype.boolean({ probability: 0.05 });
	},

	shouldBan(): boolean {
		return faker.datatype.boolean({ probability: 0.01 });
	},
};
