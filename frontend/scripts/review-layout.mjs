// Read-only geometry diagnostics; does not simulate combat or human exploration.
import { createServer } from "vite";
import { parseReviewOptions } from "./review-options.mjs";

const server = await createServer({
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
});
try {
	const { DEFAULT_RUN_CONFIGURATION, CONFIGURATION_LIMITS } =
		await server.ssrLoadModule("/src/domain/dungeon/RunConfiguration.ts");
	const { MAX_SEED } = await server.ssrLoadModule(
		"/src/domain/dungeon/Seed.ts",
	);
	const { generateDungeonRun, connectDungeonFloors } =
		await server.ssrLoadModule("/src/domain/dungeon/DungeonRun.ts");
	const { selectPlayerStart } = await server.ssrLoadModule(
		"/src/domain/dungeon/DungeonLocations.ts",
	);
	const { getRoomEndpoint } = await server.ssrLoadModule(
		"/src/domain/dungeon/Corridor.ts",
	);
	const { floorDistances, countFloorBottlenecks } = await server.ssrLoadModule(
		"/src/domain/dungeon/FloorTopology.ts",
	);
	const options = parseReviewOptions(
		process.argv.slice(2),
		DEFAULT_RUN_CONFIGURATION,
		CONFIGURATION_LIMITS,
		MAX_SEED,
	);
	const configuration = {
		...DEFAULT_RUN_CONFIGURATION,
		rows: options.rows,
		cols: options.cols,
		floorCount: options.floorCount,
	};
	if (options.help) {
		console.log(
			"Usage: node scripts/review-layout.mjs [seeds...] [--rows N --cols N --floors N --seed-start N --seed-count N --summary-only]\nDefaults: seeds 0,1,123,987; 60×60×20. Reports geometry only.",
		);
	} else {
		const records = [];
		for (const seed of options.seeds) {
			const run = connectDungeonFloors(
				generateDungeonRun(seed, configuration.floorCount, configuration),
			);
			for (const floor of run.floors) {
				const entry = floor.upStair?.coordinate ?? selectPlayerStart(floor);
				const distances = floorDistances(floor.terrain, entry),
					cols = floor.terrain[0].length;
				const steps = (point) => distances[point.row * cols + point.col];
				const roomDistances = floor.rooms.map(getRoomEndpoint).map(steps);
				const corridorLengths = floor.corridors.map((path) =>
					Math.max(0, path.length - 1),
				);
				const walkable = floor.terrain
					.flat()
					.filter((tile) => tile === ".").length;
				records.push({
					seed,
					floor: floor.floorNumber,
					rooms: floor.rooms.length,
					corridors: floor.corridors.length,
					walkable,
					unreachable: walkable - [...distances].filter((n) => n >= 0).length,
					stairSteps: floor.downStair
						? steps(floor.downStair.coordinate)
						: null,
					maxRoomSteps: Math.max(0, ...roomDistances),
					longestPlannedCorridor: Math.max(0, ...corridorLengths),
					bottleneckTiles: countFloorBottlenecks(floor.terrain),
				});
			}
		}
		const average = (key) => {
			const values = records.map((r) => r[key]).filter((n) => n !== null);
			return values.length
				? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2))
				: null;
		};
		const summary = {
			seeds: options.seeds,
			configuration: configuration,
			floors: records.length,
			unreachable: records.reduce((sum, r) => sum + r.unreachable, 0),
			meanStairSteps: average("stairSteps"),
			meanMaxRoomSteps: average("maxRoomSteps"),
			meanBottleneckTiles: average("bottleneckTiles"),
			meanLongestPlannedCorridor: average("longestPlannedCorridor"),
		};
		console.log(
			JSON.stringify(
				options.summaryOnly ? summary : { summary, records },
				null,
				2,
			),
		);
	}
} finally {
	await server.close();
}
