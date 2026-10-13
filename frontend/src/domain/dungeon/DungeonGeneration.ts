import { type Corridor, connectPartitionRooms } from "./Corridor.ts";
import { createRoomLoops } from "./CorridorLoops.ts";
import type { Dungeon, GeneratedDungeon } from "./DungeonTypes.ts";
import { makeRegion, recursivePartition } from "./Partitioning.ts";
import { assignRoomsToPartition, getTerminalRooms, type Room } from "./Room.ts";
import {
	DEFAULT_RUN_CONFIGURATION,
	type DungeonConfig,
} from "./RunConfiguration.ts";
import { createSeededRandom, hashStringToUint32 } from "./Seed.ts";
import { carveCorridors, carveRooms, makeDungeon } from "./Terrain.ts";

export const generateDungeon = (
	config: DungeonConfig,
	seed?: number,
): GeneratedDungeon => {
	const dungeon = makeDungeon(config.rows, config.cols);
	const region = makeRegion(dungeon);

	const random = seed === undefined ? undefined : createSeededRandom(seed);

	const partitionsWithRooms = assignRoomsToPartition(
		recursivePartition(region, config.minPartitionSize, random),
		config.roomPadding,
		random,
		{
			minRoomSize: config.minRoomSize ?? DEFAULT_RUN_CONFIGURATION.minRoomSize,
			maxRoomAspectRatio:
				config.maxRoomAspectRatio ??
				DEFAULT_RUN_CONFIGURATION.maxRoomAspectRatio,
		},
	);
	const rooms: Room[] = getTerminalRooms(partitionsWithRooms);
	const corridors: Corridor[] = connectPartitionRooms(partitionsWithRooms);

	const carvedDungeon: Dungeon = carveCorridors(
		carveRooms(dungeon, rooms),
		corridors,
	);

	const loops =
		seed === undefined
			? []
			: createRoomLoops(
					carvedDungeon,
					rooms,
					createSeededRandom(hashStringToUint32(`${seed}:corridor-loops`)),
				);
	return {
		terrain: carveCorridors(carvedDungeon, loops),
		partitions: partitionsWithRooms,
		rooms,
		corridors: [...corridors, ...loops],
	};
};
