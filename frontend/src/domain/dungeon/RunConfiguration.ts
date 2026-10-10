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
	rows: 30,
	cols: 100,
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
