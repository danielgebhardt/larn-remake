import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

// Generate current, validated saves instead of maintaining another hand-edited schema.
export default async function prepareFixtures() {
	const server = await createServer({
		root: fileURLToPath(new URL("../", import.meta.url)),
		configFile: false,
		server: { middlewareMode: true, hmr: false, ws: false },
		optimizeDeps: { noDiscovery: true, entries: [] },
		appType: "custom",
	});
	try {
		const load = (path) => server.ssrLoadModule(path);
		const { DEFAULT_RUN_CONFIGURATION, DEFAULT_FOG_CONFIGURATION } = await load(
			"/src/domain/dungeon/RunConfiguration.ts",
		);
		const { generateDungeonRun, connectDungeonFloors } = await load(
			"/src/domain/dungeon/DungeonRun.ts",
		);
		const { createGameState } = await load("/src/domain/game/GameState.ts");
		const { updateExploration } = await load(
			"/src/domain/dungeon/Exploration.ts",
		);
		const { navigationRun } = await load(
			"/src/domain/objects/NavigationTerrain.ts",
		);
		const { createSaveDocument, serializeSave, parseSave } = await load(
			"/src/domain/saves/SaveFormat.ts",
		);
		const configuration = {
			...DEFAULT_RUN_CONFIGURATION,
			rows: 20,
			cols: 20,
			floorCount: 5,
			difficulty: 1.25,
		};
		const fog = { ...DEFAULT_FOG_CONFIGURATION, enabled: false };
		const run = connectDungeonFloors(generateDungeonRun(123, 5, configuration));
		const fresh = createGameState(run, configuration.difficulty);
		const quiet = {
			...fresh,
			monsters: [],
			player: { ...fresh.player, health: 1 },
			floorItems: [
				...fresh.floorItems.filter((entry) => entry.item.kind === "cure"),
				{
					item: { id: "smoke:potion", kind: "healing-potion" },
					floorNumber: 1,
					coordinate: run.playerCoordinate,
				},
			],
		};
		const poisoned = {
			...quiet,
			effects: [
				{
					actorId: "player",
					floorNumber: null,
					kind: "poisoned",
					remaining: 1,
				},
			],
		};
		const directory = new URL(".generated/", import.meta.url);
		await mkdir(directory, { recursive: true });
		for (const [name, state] of [
			["ready", quiet],
			["poisoned", poisoned],
		]) {
			const exploration = updateExploration(navigationRun(state), fog.radius);
			const text = serializeSave(
				createSaveDocument(
					state,
					exploration,
					configuration,
					fog,
					new Date("2026-10-13T12:00:00Z"),
				),
			);
			const checked = parseSave(text);
			if (!checked.ok)
				throw new Error(`${name} smoke fixture: ${checked.error}`);
			await writeFile(new URL(`${name}.json`, directory), text);
		}
	} finally {
		await server.close();
	}
}
