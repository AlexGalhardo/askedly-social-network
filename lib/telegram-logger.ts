import { DateTime } from "./date-time";

class TelegramLogger {
	private readonly baseUrl: string;

	constructor(
		private readonly token: string = process.env.TELEGRAM_BOT_HTTP_TOKEN as string,
		private readonly channelId: number = parseInt(process.env.TELEGRAM_BOT_CHANNEL_ID as string),
	) {
		this.isThereToken(token);
		this.isThereChannelId(channelId);
		this.token = token;
		this.channelId = channelId;
		this.baseUrl = `https://api.telegram.org/bot${this.token}`;
	}

	private isThereToken(token: string) {
		if (!token) console.log("There is no Telegram Token in TelegramLogger Class Constructor");
	}

	private isThereChannelId(channelId: number) {
		if (typeof channelId !== "number" || channelId <= 0 || isNaN(channelId)) {
			console.log("There is no valid Telegram Channel Id in TelegramLogger Class Constructor");
		}
	}

	private async log(logType: string, message: string) {
		const messageToSend = `${logType} \n\nCriado em: ${DateTime.logAgora()}\n\n${message}`;
		await this.sendRequest(messageToSend);
	}

	private async sendRequest(messageToSend: string): Promise<void> {
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 8000);

			const res = await fetch(`${this.baseUrl}/sendMessage`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					chat_id: this.channelId,
					text: messageToSend,
					parse_mode: "HTML",
				}),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			if (!res.ok) {
				const data = await res.text();
				console.error("Telegram API Error Response:", data);
			}
		} catch (error: any) {
			if (error.name === "AbortError") {
				console.error("TelegramLogger Timeout Error");
			}
		}
	}

	async error(message: string) {
		try {
			await this.log(`🚨 ERROR 🚨`, message);
		} catch (error: any) {
			console.error("Failed to send error log to Telegram:", error);
		}
	}

	async info(message: string) {
		try {
			await this.log(`💬 INFO 💬`, message);
		} catch (error: any) {
			console.error("Failed to send info log to Telegram:", error);
		}
	}

	async warning(message: string) {
		try {
			await this.log(`⚠️ WARNING ⚠️`, message);
		} catch (error: any) {
			console.error("Failed to send warning log to Telegram:", error);
		}
	}

	async success(message: string) {
		try {
			await this.log(`✅ SUCCESS ✅`, message);
		} catch (error: any) {
			console.error("Failed to send success log to Telegram:", error);
		}
	}
}

const TelegramLog = new TelegramLogger(
	process.env.TELEGRAM_BOT_HTTP_TOKEN,
	parseInt(process.env.TELEGRAM_BOT_CHANNEL_ID as string),
);

export default TelegramLog;
