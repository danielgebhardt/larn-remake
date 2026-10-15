// Domain timings are informational, not hardware-dependent pass/fail tests.
import { performance } from "node:perf_hooks";
import { createServer } from "vite";

const server = await createServer({
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
});
try {
	const { generateDungeonRun, connectDungeonFloors } =
		await server.ssrLoadModule("/src/domain/dungeon/DungeonRun.ts");
	const { DEFAULT_RUN_CONFIGURATION, DEFAULT_FOG_CONFIGURATION } =
		await server.ssrLoadModule("/src/domain/dungeon/RunConfiguration.ts");
	const { createGameState } = await server.ssrLoadModule(
		"/src/domain/game/GameState.ts",
	);
	const { resolveMonsterPhase } = await server.ssrLoadModule(
		"/src/domain/monsters/MonsterTurns.ts",
	);
	const { calculateVisibility } = await server.ssrLoadModule(
		"/src/domain/dungeon/Visibility.ts",
	);
	const initial = createGameState(
		connectDungeonFloors(
			generateDungeonRun(123, 20, {
				...DEFAULT_RUN_CONFIGURATION,
				rows: 100,
				cols: 100,
			}),
		),
	);
	const terrain = Array.from({ length: 100 }, (_, row) =>
		Array.from({ length: 100 }, (_, col) =>
			row === 0 || col === 0 || row === 99 || col === 99 ? "#" : ".",
		),
	);
	const run = {
		...initial.run,
		activeFloor: 10,
		playerCoordinate: { row: 50, col: 50 },
		floors: initial.run.floors.map((floor) =>
			floor.floorNumber === 10 ? { ...floor, terrain } : floor,
		),
	};
	const positions = [
		[49, 50],
		[50, 51],
		[51, 50],
		[50, 49],
		[48, 50],
		[50, 52],
		[52, 50],
		[50, 48],
		[48, 48],
		[48, 52],
		[52, 48],
		[52, 52],
	];
	const actor = (index, kind, coordinate, intent = { type: "idle" }) => ({
		id: `10:${index + 1}`,
		kind,
		floorNumber: 10,
		coordinate,
		health: kind === "dungeon-brute" ? 10 : kind === "goblin-archer" ? 5 : 4,
		intent,
	});
	const inactive = initial.monsters.filter(
		(monster) => monster.floorNumber !== 10,
	);
	const fixtures = {
		"crowded-blocked-pursuit": positions.map(([row, col], index) =>
			actor(index, "goblin", { row, col }),
		),
		"reachable-pursuit": Array.from({ length: 12 }, (_, index) =>
			actor(index, "goblin", {
				row: 45 + Math.floor(index / 6),
				col: 47 + (index % 6),
			}),
		),
		"archer-shots": Array.from({ length: 12 }, (_, index) =>
			actor(index, "goblin-archer", {
				row: 48 + Math.floor(index / 5),
				col: 48 + (index % 5),
			}),
		).filter(
			(monster) =>
				Math.abs(monster.coordinate.row - 50) +
					Math.abs(monster.coordinate.col - 50) >=
				2,
		),
		"brute-preparation": positions
			.slice(0, 4)
			.map(([row, col], index) => actor(index, "dungeon-brute", { row, col })),
		"brute-resolution": positions
			.slice(0, 4)
			.map(([row, col], index) =>
				actor(
					index,
					"dungeon-brute",
					{ row, col },
					{ type: "preparing-attack", target: { row: 50, col: 50 } },
				),
			),
	};
	const measure = (name, task, activeActors) => {
		for (let warm = 0; warm < 5; warm++) task();
		const samples = [];
		for (let sample = 0; sample < 30; sample++) {
			const start = performance.now();
			task();
			samples.push(performance.now() - start);
		}
		samples.sort((a, b) => a - b);
		return {
			name,
			activeActors,
			samples: 30,
			medianMs: +samples[15].toFixed(3),
			p95Ms: +samples[28].toFixed(3),
			maxMs: +samples[29].toFixed(3),
		};
	};
	const results = Object.entries(fixtures).map(([name, monsters]) => {
		const state = {
			...initial,
			run,
			turn: 1,
			monsters: [...inactive, ...monsters],
		};
		return measure(name, () => resolveMonsterPhase(state), monsters.length);
	});
	const sensedRun = {
		...run,
		floors: run.floors.map((floor) =>
			floor.floorNumber === 10
				? {
						...floor,
						terrain: terrain.map((row, index) =>
							row.map((tile, col) =>
								col === 40 && index >= 44 && index <= 56 ? "#" : tile,
							),
						),
					}
				: floor,
		),
	};
	const sensed = {
		...initial,
		run: sensedRun,
		objects: [],
		turn: 1,
		quest: { ...initial.quest, cureRecovered: true },
		escape: { startedTurn: 0, activatedFloors: [10] },
		monsters: Array.from({ length: 16 }, (_, index) => ({
			...actor(index, "wraith", {
				row: 47 + Math.floor(index / 4),
				col: 30 + (index % 4),
			}),
			health: 18,
		})),
	};
	results.push(
		measure(
			"escape-sensing-through-wall-16",
			() => resolveMonsterPhase(sensed),
			16,
		),
	);
	const doorState = {
		...initial,
		run,
		turn: 1,
		objects: [
			{
				id: "floor:10:object:door:1",
				kind: "door",
				floorNumber: 10,
				coordinate: { row: 50, col: 51 },
				activated: false,
			},
		],
		monsters: [
			{
				id: "10:1",
				kind: "orc",
				floorNumber: 10,
				coordinate: { row: 50, col: 52 },
				health: 7,
				intent: { type: "idle" },
				awareness: {
					type: "pursuing",
					target: run.playerCoordinate,
					remaining: 12,
					blocked: 0,
				},
			},
		],
	};
	results.push(
		measure("remembered-door-opening", () => resolveMonsterPhase(doorState), 1),
	);
	results.push(
		measure(
			`visibility-radius-${DEFAULT_FOG_CONFIGURATION.radius}`,
			() =>
				calculateVisibility(
					terrain,
					run.playerCoordinate,
					DEFAULT_FOG_CONFIGURATION.radius,
				),
			0,
		),
	);
	console.log(
		JSON.stringify(
			{
				dimensions: "100x100x20",
				seed: 123,
				inactiveActors: inactive.length,
				results,
			},
			null,
			2,
		),
	);
} finally {
	await server.close();
}
