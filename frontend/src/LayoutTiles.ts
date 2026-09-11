export const WALL: string = "#";
export const FLOOR: string = ".";

export const dungeon: string[][] = [
	[WALL, WALL, WALL, WALL, WALL],
	[WALL, FLOOR, FLOOR, FLOOR, WALL],
	[WALL, FLOOR, WALL, FLOOR, WALL],
	[WALL, FLOOR, FLOOR, FLOOR, WALL],
	[WALL, WALL, WALL, WALL, WALL],
];

export const getDungeonCoordinateValue = (
	x: number,
	y: number,
	dungeon: string[][],
): string | undefined => {
	return dungeon[x]?.[y];
};
