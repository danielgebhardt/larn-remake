import type { Coordinate } from "../dungeon/DungeonTypes";
import { createSeededRandom, hashStringToUint32 } from "../dungeon/Seed";
import type { GameState } from "../game/GameState";
import { sealedEliteTiles } from "../objects/OptionalEliteRooms";
import { type Monster, selectMonsterKind } from "./Monster";
import {
	coordinateKey,
	orthogonalDistance,
	protectedFloorLocations,
} from "./MonsterLocations";
import { maximumMonsterHealth } from "./MonsterStats";

export const ESCAPE_ENCOUNTER_RULES = {
	arrivalBuffer: 3,
	safeTilesPerMonster: 120,
	maximumNewMonsters: 4,
	maximumLivingMonsters: 16,
	firstSpawnIndex: 10001,
} as const;

// Build only the requested return floor. The cure floor has no second wave.
export const generateEscapeEncounters = (
	state: GameState,
	floorNumber: number,
): readonly Monster[] => {
	if (
		!Number.isInteger(floorNumber) ||
		floorNumber < 1 ||
		floorNumber >= state.quest.goalFloor
	)
		return [];
	const floor = state.run.floors[floorNumber - 1];
	if (!floor) return [];
	const rules = ESCAPE_ENCOUNTER_RULES;
	const living = state.monsters.filter(
		(actor) => actor.floorNumber === floorNumber && actor.health > 0,
	);
	const protectedTiles = protectedFloorLocations(state.run, floorNumber);
	if (floorNumber === 1) protectedTiles.push(state.quest.entrance);
	if (floorNumber === state.run.activeFloor)
		protectedTiles.push(state.run.playerCoordinate);
	const occupied = new Set(
		[...living, ...state.objects, ...state.floorItems]
			.filter((entry) => entry.floorNumber === floorNumber)
			.map((entry) => coordinateKey(entry.coordinate)),
	);
	for (const key of sealedEliteTiles(floor, state.objects)) occupied.add(key);
	const candidates: Coordinate[] = [];
	for (const [row, tiles] of floor.terrain.entries())
		for (const [col, tile] of tiles.entries()) {
			const point = { row, col };
			if (
				tile === "." &&
				!occupied.has(coordinateKey(point)) &&
				protectedTiles.every(
					(protectedTile) =>
						orthogonalDistance(point, protectedTile) > rules.arrivalBuffer,
				)
			)
				candidates.push(point);
		}
	const count = Math.min(
		candidates.length,
		rules.maximumNewMonsters,
		Math.ceil(candidates.length / rules.safeTilesPerMonster),
		Math.max(0, rules.maximumLivingMonsters - living.length),
	);
	const existingIds = new Set(state.monsters.map((actor) => actor.id));
	const actors: Monster[] = [];
	let spawnIndex = rules.firstSpawnIndex;
	for (let index = 1; index <= count; index++) {
		const random = createSeededRandom(
			hashStringToUint32(`${state.run.seed}:${floorNumber}:escape:${index}`),
		);
		const [coordinate] = candidates.splice(
			Math.floor(random() * candidates.length),
			1,
		);
		const kind = selectMonsterKind(
			floorNumber,
			createSeededRandom(
				hashStringToUint32(
					`${state.run.seed}:${floorNumber}:escape-kinds:${index}`,
				),
			),
		);
		if (!kind) break;
		while (existingIds.has(`${floorNumber}:${spawnIndex}`)) spawnIndex++;
		actors.push({
			id: `${floorNumber}:${spawnIndex++}`,
			kind,
			floorNumber,
			coordinate,
			health: maximumMonsterHealth(kind, state.difficulty),
			intent: { type: "idle" },
			awareness: { type: "idle" },
			lastDamagedTurn: null,
		});
	}
	return actors;
};
