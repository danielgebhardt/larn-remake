// Generated supply potential; does not simulate acquisition or survival.
import { createServer } from "vite";
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
		const { createMonsterDrop } = await load(
			"/src/domain/items/MonsterDrops.ts",
		);
		const { chestReward } = await load("/src/domain/objects/TreasureChests.ts");
		const { rewardBudget } = await load("/scripts/reward-budget.mjs");
		const { experienceBudget } = await load("/scripts/experience-budget.mjs");
		const configuration = {
			...defaults,
			rows: options.rows,
			cols: options.cols,
			floorCount: options.floorCount,
		};
		for (const seed of options.seeds) {
			const state = createGameState(
				connectDungeonFloors(
					generateDungeonRun(seed, configuration.floorCount, configuration),
				),
			);
			console.log(
				JSON.stringify({
					seed,
					configuration,
					...rewardBudget(state, createMonsterDrop, chestReward),
					experience: experienceBudget(state),
				}),
			);
		}
	}
} finally {
	await server.close();
}
