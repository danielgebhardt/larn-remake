import {
	type Coordinate,
	type DungeonConfig,
	type GeneratedDungeon,
	generateDungeon,
	type LocationSelectionSource,
	selectPlayerStart,
	selectStairLocation,
} from "./LayoutTiles.ts";

export type DungeonFloor = GeneratedDungeon & {
	floorNumber: number;
	upStair?: StairLink;
	downStair?: StairLink;
};

export type DungeonRun = {
	seed: number;
	floors: DungeonFloor[];
	activeFloor: number;
	playerCoordinate: Coordinate;
};

export type StairLink = {
	coordinate: Coordinate;
	destinationFloor: number;
	arrivalCoordinate: Coordinate;
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
		floorNumber,
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

const getLocationSource = (floor: DungeonFloor): LocationSelectionSource => ({
	terrain: floor.terrain,
	rooms: floor.rooms,
});

export const connectDungeonFloors = (run: DungeonRun): DungeonRun => {
	const floors = run.floors.map((floor) => ({ ...floor }));

	for (let i = 0; i < floors.length - 1; i++) {
		const shallowerFloor = floors[i];
		const deeperFloor = floors[i + 1];

		const shallowerSource = getLocationSource(shallowerFloor);
		const deeperSource = getLocationSource(deeperFloor);

		const shallowerEntry = selectPlayerStart(shallowerSource);
		const deeperEntry = selectPlayerStart(deeperSource);

		const shallowerStair = selectStairLocation(shallowerSource, shallowerEntry);

		shallowerFloor.downStair = {
			coordinate: shallowerStair,
			destinationFloor: deeperFloor.floorNumber,
			arrivalCoordinate: deeperEntry,
		};

		deeperFloor.upStair = {
			coordinate: deeperEntry,
			destinationFloor: shallowerFloor.floorNumber,
			arrivalCoordinate: shallowerStair,
		};
	}

	return {
		...run,
		floors,
	};
};

export const descendDungeonRun = (run: DungeonRun): DungeonRun => {
	const currentFloor = run.floors[run.activeFloor - 1];
	const downStair = currentFloor.downStair;

	if (
		!downStair ||
		downStair.coordinate.row !== run.playerCoordinate.row ||
		downStair.coordinate.col !== run.playerCoordinate.col
	) {
		return run;
	}

	const destinationFloor = run.floors.find(
		(floor) => floor.floorNumber === downStair.destinationFloor,
	);

	if (!destinationFloor) {
		return run;
	}

	return {
		...run,
		playerCoordinate: downStair.arrivalCoordinate,
		activeFloor: downStair.destinationFloor,
	};
};
