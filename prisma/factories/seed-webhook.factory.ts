import { faker } from "@faker-js/faker";
import { SeedWebhookInterface } from "../helpers/seed-interfaces.helper";
import { SeedHelpers } from "../helpers/seed-helpers.helper";

export class SeedWebhookFactory {
	static create(pixId: string, amount: number): Omit<SeedWebhookInterface, "created_at" | "updated_at"> {
		return {
			id: faker.string.uuid(),
			pix_id: pixId,
			status: faker.helpers.arrayElement(["PENDING", "PAID", "CANCELLED", "EXPIRED"]),
			amount,
			fee: SeedHelpers.calculateFee(amount),
			method: "PIX",
			kind: faker.helpers.arrayElement(["payment", "refund"]),
			event_status: faker.helpers.arrayElement(["created", "processing", "completed", "failed"]),
			dev_mode: faker.datatype.boolean({ probability: 1 }),
			complete_event: JSON.stringify({
				event_id: faker.string.uuid(),
				timestamp: faker.date.recent().toISOString(),
				data: {
					transaction_id: pixId,
					amount,
					status: "completed",
				},
			}),
			is_seed: true,
		};
	}
}
