import type { Corridor } from "./Corridor.ts";
import type { PartitionNode } from "./Partitioning.ts";
import type { Room } from "./Room.ts";

export type Dungeon = readonly (readonly string[])[];
export type Coordinate = { row: number; col: number };

export type GeneratedDungeon = {
	terrain: Dungeon;
	partitions: PartitionNode;
	rooms: Room[];
	corridors: Corridor[];
};

export type LocationSelectionSource = Pick<
	GeneratedDungeon,
	"rooms" | "terrain"
>;
