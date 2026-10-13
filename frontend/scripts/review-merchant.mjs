// Generated-income diagnostics, not a played win-rate simulation.
import { createServer } from "vite";
import { merchantGoldBudget } from "./merchant-budget.mjs";
import { parseReviewOptions, REVIEW_USAGE } from "./review-options.mjs";

const server = await createServer({
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
});
try {
	const load = (path) => server.ssrLoadModule(path);
	const { DEFAULT_RUN_CONFIGURATION: defaults, CONFIGURATION_LIMITS: limits } =
		await load("/src/domain/dungeon/RunConfiguration.ts");
	const options = parseReviewOptions(
		process.argv.slice(2),
		defaults,
		limits,
		0xffffffff,
	);
	if (options.help) console.log(REVIEW_USAGE);
	else {
		const { generateDungeonRun, connectDungeonFloors } = await load(
			"/src/domain/dungeon/DungeonRun.ts",
		);
		const { createGameState } = await load("/src/domain/game/GameState.ts");
		const { goldAmount } = await load("/src/domain/objects/Gold.ts");
		const { MERCHANT_OFFERS } = await load(
			"/src/domain/merchant/MerchantRules.ts",
		);
		const { merchantFloors } = await load(
			"/src/domain/merchant/MerchantPlacement.ts",
		);
		const config = {
			...defaults,
			rows: options.rows,
			cols: options.cols,
			floorCount: options.floorCount,
		};
		for (const seed of options.seeds) {
			const state = createGameState(
				connectDungeonFloors(
					generateDungeonRun(seed, config.floorCount, config),
				),
			);
			console.log(
				JSON.stringify({
					seed,
					rows: config.rows,
					cols: config.cols,
					floors: config.floorCount,
					...merchantGoldBudget(
						state,
						goldAmount,
						MERCHANT_OFFERS,
						merchantFloors(config.floorCount),
					),
				}),
			);
		}
	}
} finally {
	await server.close();
}
