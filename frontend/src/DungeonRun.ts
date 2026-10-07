import {
	type Coordinate,
	type DungeonConfig,
	type GeneratedDungeon,
	generateDungeon,
	selectPlayerStart,
} from "./LayoutTiles.ts";

export type DungeonFloor = GeneratedDungeon & {
	floorNumber: number;
};

export type DungeonRun = {
	seed: number;
	floors: DungeonFloor[];
	activeFloor: number;
	playerCoordinate: Coordinate;
};

export const hashStringToUint32 = (value: string): number => {
	let hash = 1779033703 ^ value.length;

	for (let i = 0; i < value.length; i++) {
		hash = Math.imul(hash ^ value.charCodeAt(i), 3432918353);
		hash = (hash << 13) | (hash >>> 19);
	}

	hash = Math.imul(hash ^ (hash >>> 16), 2246822507);
	hash = Math.imul(hash ^ (hash >>> 13), 3266489909);
	hash ^= hash >>> 16;

	return hash >>> 0;
};

export const deriveFloorSeed = (seed: number, floorNumber: number): number => {
	if (!Number.isInteger(floorNumber) || floorNumber < 1) {
		throw new RangeError("Floor number must be a positive whole number");
	}

	return hashStringToUint32(`${seed}:${floorNumber}`);
};

export const generateDungeonFloor = (
	seed: number,
	floorNumber: number,
	config: DungeonConfig,
): DungeonFloor => {
	return {
		...generateDungeon(config, deriveFloorSeed(seed, floorNumber)),
		floorNumber: floorNumber,
	};
};

export const createDungeonRun = (
	seed: number,
	floors: DungeonFloor[],
): DungeonRun => {
	if (floors.length < 1) {
		throw new RangeError("Dungeon run must contain at least one floor");
	}

	for (let i = 0; i < floors.length; i++) {
		if (floors[i].floorNumber !== i + 1) {
			throw new RangeError("Dungeon floor numbers must be sequential");
		}
	}

	const startingPoint = selectPlayerStart(floors[0]);

	return {
		seed,
		floors,
		activeFloor: 1,
		playerCoordinate: startingPoint,
	};
};

export const generateDungeonRun = (
	seed: number,
	numberOfFloors: number,
	config: DungeonConfig,
): DungeonRun => {
	if (!Number.isInteger(numberOfFloors) || numberOfFloors < 1) {
		throw new RangeError("Floor count must be a positive whole number");
	}

	const floors: DungeonFloor[] = [];

	for (let i = 1; i <= numberOfFloors; i++) {
		floors.push(generateDungeonFloor(seed, i, config));
	}

	return createDungeonRun(seed, floors);
};
