import { type Corridor, connectPartitionRooms } from "./Corridor.ts";
import type { Dungeon, GeneratedDungeon } from "./DungeonTypes.ts";
import { makeRegion, recursivePartition } from "./Partitioning.ts";
import { assignRoomsToPartition, getTerminalRooms, type Room } from "./Room.ts";
import {
	DEFAULT_RUN_CONFIGURATION,
	type DungeonConfig,
} from "./RunConfiguration.ts";
import { createSeededRandom } from "./Seed.ts";
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

	return {
		terrain: carvedDungeon,
		partitions: partitionsWithRooms,
		rooms,
		corridors,
	};
};
