import { SeedOrchestrator } from "./seed-orchestrator";

async function main() {
	const orchestrator = new SeedOrchestrator();
	await orchestrator.execute();
}

main();
