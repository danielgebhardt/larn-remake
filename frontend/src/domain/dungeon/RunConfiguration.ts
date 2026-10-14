import type { Difficulty } from "../game/Difficulty";
export const MAX_SIZE = 100;
export const MAX_FLOORS = 20;

export type RoomConfiguration = {
	minRoomSize: number;
	maxRoomAspectRatio: number;
};

export type DungeonConfig = {
	rows: number;
	cols: number;
	minPartitionSize: number;
	roomPadding: number;
} & Partial<RoomConfiguration>;

export type RunConfiguration = Required<DungeonConfig> & {
	floorCount: number;
	difficulty?: Difficulty;
};

export const DEFAULT_RUN_CONFIGURATION: RunConfiguration = {
	rows: 40,
	cols: 40,
	floorCount: 20,
	difficulty: 1,
	minPartitionSize: 8,
	roomPadding: 1,
	minRoomSize: 3,
	maxRoomAspectRatio: 3,
};
export const CONFIGURATION_LIMITS = {
	rows: { min: 10, max: MAX_SIZE },
	cols: { min: 10, max: MAX_SIZE },
	floorCount: { min: 5, max: MAX_FLOORS },
};

export type FogConfiguration = { enabled: boolean; radius: number };
export const DEFAULT_FOG_CONFIGURATION: FogConfiguration = {
	enabled: true,
	radius: 8,
};
export const FOG_RADIUS_LIMITS = { min: 1, max: 20 };

// Internal generation rules; settings and saved configuration fields are unchanged.
export const LOOP_CORRIDOR_RULES = {
	maxLength: 18,
	roomsPerLoop: 12,
	maxPerFloor: 6,
	minSavedSteps: 5,
	minDetourRatio: 1.4,
	nearestRooms: 3,
	candidateJitter: 8,
} as const;

// Map dimensions only; floor count and difficulty remain independent choices.
export const DUNGEON_SIZE_PRESETS = [
	{ label: "Small", rows: 20, cols: 20 },
	{ label: "Medium", rows: 40, cols: 40 },
	{ label: "Large", rows: 60, cols: 60 },
] as const;
