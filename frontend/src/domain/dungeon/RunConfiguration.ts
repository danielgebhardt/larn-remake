export const MAX_SIZE = 100;

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
};

export const DEFAULT_RUN_CONFIGURATION: RunConfiguration = {
	rows: 15,
	cols: 15,
	floorCount: 3,
	minPartitionSize: 8,
	roomPadding: 1,
	minRoomSize: 3,
	maxRoomAspectRatio: 3,
};
export const CONFIGURATION_LIMITS = {
	rows: { min: 10, max: MAX_SIZE },
	cols: { min: 10, max: MAX_SIZE },
	floorCount: { min: 1, max: 10 },
};

export type FogConfiguration = { enabled: boolean; radius: number };
export const DEFAULT_FOG_CONFIGURATION: FogConfiguration = {
	enabled: true,
	radius: 6,
};
export const FOG_RADIUS_LIMITS = { min: 1, max: 20 };
