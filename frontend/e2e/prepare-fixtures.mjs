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
		const { createReviewEncounter } = await load("/scripts/evasion-review.ts");
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
			bag: { items: [] },
			potionHotbar: [null, null, null, null],
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
		// Seed 123 has a room at these explicit coordinates, away from map edges.
		if (run.floors[0].terrain[8][10] !== ".")
			throw new Error("Expected the scrolling fixture's room tile");
		const scrolling = {
			...quiet,
			run: { ...run, playerCoordinate: { row: 8, col: 10 } },
			objects: [],
			floorItems: quiet.floorItems.filter(
				(entry) => entry.item.kind === "cure",
			),
		};
		const stacks = {
			...quiet,
			mana: 0,
			objects: [],
			floorItems: quiet.floorItems.filter(
				(entry) => entry.item.kind === "cure",
			),
			potionHotbar: ["mana-potion", null, null, null],
			bag: {
				items: [
					{ id: "stack:scroll:1", kind: "enchantment-scroll" },
					{ id: "stack:sword", kind: "iron-sword", enchantment: 1 },
					{ id: "stack:mana:1", kind: "mana-potion" },
					{ id: "stack:scroll:2", kind: "enchantment-scroll" },
					{ id: "stack:shield", kind: "tower-shield" },
					{ id: "stack:mana:2", kind: "mana-potion" },
					{ id: "stack:scroll:3", kind: "enchantment-scroll" },
					{ id: "stack:mana:3", kind: "mana-potion" },
				],
			},
		};
		const { createEquipment } = await load("/src/domain/items/Equipment.ts");
		const merchantConfiguration = { ...configuration, floorCount: 10 };
		const merchantFresh = createGameState(
			connectDungeonFloors(generateDungeonRun(123, 10, merchantConfiguration)),
			configuration.difficulty,
		);
		const merchant = merchantFresh.objects.find(
			(object) => object.kind === "merchant" && object.floorNumber === 5,
		);
		if (!merchant)
			throw new Error("Expected the deterministic floor 5 merchant");
		const merchantState = {
			...merchantFresh,
			run: {
				...merchantFresh.run,
				activeFloor: 5,
				playerCoordinate: merchant.coordinate,
			},
			monsters: [],
			objects: merchantFresh.objects.filter(
				(object) => object.kind === "merchant",
			),
			floorItems: merchantFresh.floorItems.filter(
				(entry) => entry.item.kind === "cure",
			),
			gold: 700,
			progression: { experience: 30 },
			player: { health: 7, maxHealth: 14 },
			mana: 3,
			effects: [
				{
					actorId: "player",
					floorNumber: null,
					kind: "protected",
					remaining: 4,
				},
			],
			equipment: createEquipment(
				{ id: "worn:sword", kind: "iron-sword" },
				{ id: "worn:shield", kind: "wooden-shield" },
				{ id: "worn:plate", kind: "plate-armor" },
				null,
				{ id: "worn:strength", kind: "ring-strength" },
				{ id: "worn:mana", kind: "ring-mana" },
			),
			bag: {
				items: [
					{ id: "bag:ring", kind: "ring-intelligence" },
					{ id: "bag:sword", kind: "short-sword" },
				],
			},
		};
		const { corridorView, corridorStep } = await load(
			"/src/domain/game/CorridorTravel.ts",
		);
		let corridorState;
		for (const floor of run.floors) {
			for (
				let row = 1;
				row < floor.terrain.length - 1 && !corridorState;
				row++
			) {
				for (
					let col = 1;
					col < floor.terrain[row].length - 1 && !corridorState;
					col++
				) {
					if (floor.terrain[row][col] !== ".") continue;
					const candidate = {
						...quiet,
						objects: [],
						floorItems: quiet.floorItems.filter((x) => x.item.kind === "cure"),
						run: {
							...run,
							activeFloor: floor.floorNumber,
							playerCoordinate: { row, col },
						},
					};
					let probe = candidate;
					let previous;
					let steps = 0;
					for (let step = 0; step < 8; step++) {
						const projected = corridorView(
							probe,
							updateExploration(navigationRun(probe), fog.radius),
							false,
						);
						const decision = corridorStep(projected, "right", previous);
						if ("stop" in decision) break;
						previous = probe.run.playerCoordinate;
						const offsets = {
							up: [-1, 0],
							down: [1, 0],
							left: [0, -1],
							right: [0, 1],
						};
						const [dr, dc] = offsets[decision.direction];
						probe = {
							...probe,
							run: {
								...probe.run,
								playerCoordinate: {
									row: previous.row + dr,
									col: previous.col + dc,
								},
							},
						};
						steps++;
					}
					if (steps >= 4) corridorState = candidate;
				}
			}
			if (corridorState) break;
		}
		if (!corridorState)
			throw new Error("Expected a quiet corridor for travel verification");
		const directory = new URL(".generated/", import.meta.url);
		const escaping = createReviewEncounter(3, 1172903873);
		const ember = quiet.floorItems.find((entry) => entry.item.kind === "cure");
		if (!ember) throw new Error("Expected the quest item");
		const entrance = quiet.quest.entrance;
		const approach = [
			[-1, 0],
			[0, 1],
			[1, 0],
			[0, -1],
		]
			.map(([dr, dc]) => ({ row: entrance.row + dr, col: entrance.col + dc }))
			.find((point) => run.floors[0].terrain[point.row]?.[point.col] === ".");
		if (!approach) throw new Error("Expected an entrance approach");
		await mkdir(directory, { recursive: true });
		for (const [name, state, config, fixtureFog = fog] of [
			["corridor", corridorState, configuration],
			["corridor-fog", corridorState, configuration, { ...fog, enabled: true }],
			[
				"ember-pickup",
				{
					...quiet,
					run: { ...run, activeFloor: 5, playerCoordinate: ember.coordinate },
				},
				configuration,
			],
			[
				"ember-homecoming",
				{
					...quiet,
					run: { ...run, playerCoordinate: approach },
					floorItems: [],
					quest: { ...quiet.quest, cureRecovered: true },
					escape: { startedTurn: 0, activatedFloors: [1] },
				},
				configuration,
			],
			[
				"escape",
				{
					...escaping,
					monsters: [],
					run: { ...escaping.run, playerCoordinate: { row: 1, col: 2 } },
					quest: { ...escaping.quest, cureRecovered: true },
					escape: { startedTurn: escaping.turn, activatedFloors: [] },
					floorItems: [],
				},
				DEFAULT_RUN_CONFIGURATION,
			],
			[
				"evasion",
				createReviewEncounter(3, 1172903873),
				DEFAULT_RUN_CONFIGURATION,
			],
			["ready", quiet, configuration],
			["poisoned", poisoned, configuration],
			["scrolling", scrolling, configuration],
			["stacks", stacks, configuration],
			["merchant", merchantState, merchantConfiguration],
			[
				"merchant-bulk",
				{
					...merchantState,
					equipment: {
						...merchantState.equipment,
						mainHand: { id: "worn:sword", kind: "iron-sword", enchantment: 1 },
					},
					bag: {
						items: [
							{ id: "bulk:lower:1", kind: "short-sword" },
							{ id: "bulk:same", kind: "iron-sword", enchantment: 1 },
							{ id: "bulk:better", kind: "short-sword", enchantment: 3 },
							{ id: "bulk:tradeoff", kind: "scholar-robe" },
							{ id: "bulk:ring", kind: "ring-intelligence" },
							{ id: "bulk:lower:2", kind: "short-sword", enchantment: 1 },
							{ id: "bulk:potion", kind: "healing-potion" },
						],
					},
				},
				merchantConfiguration,
			],
			[
				"merchant-many",
				{
					...merchantState,
					bag: {
						items: Array.from({ length: 20 }, (_, index) => ({
							id: `sale:${index}`,
							kind: "short-sword",
						})),
					},
				},
				merchantConfiguration,
			],
		]) {
			const exploration = updateExploration(
				navigationRun(state),
				fixtureFog.radius,
			);
			const text = serializeSave(
				createSaveDocument(
					state,
					exploration,
					config,
					fixtureFog,
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
