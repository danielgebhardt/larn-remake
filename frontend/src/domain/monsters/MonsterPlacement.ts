import { selectPlayerStart } from "../dungeon/DungeonLocations";
import { type DungeonRun, hashStringToUint32 } from "../dungeon/DungeonRun";
import type { Coordinate } from "../dungeon/DungeonTypes";
import { createSeededRandom } from "../dungeon/Seed";
import { FLOOR } from "../dungeon/Tiles";
import {
	MONSTER_DEFINITIONS,
	type Monster,
	selectMonsterKind,
} from "./Monster";
import {
	orthogonalDistance,
	protectedSpawnLocations,
} from "./MonsterLocations";

export const MONSTER_DENSITY = {
	min: 2,
	max: 12,
	safeTilesPerMonster: 30,
} as const;
export const monsterCountForSpace = (space: number): number => {
	if (!Number.isInteger(space) || space < 0)
		throw new RangeError("Safe space must be a nonnegative whole number.");
	return Math.min(
		space,
		MONSTER_DENSITY.max,
		Math.max(
			MONSTER_DENSITY.min,
			Math.ceil(space / MONSTER_DENSITY.safeTilesPerMonster),
		),
	);
};

export const spawnRunMonsters = (
	run: DungeonRun,
	count?: number,
): readonly Monster[] => {
	if (count !== undefined && (!Number.isInteger(count) || count < 0))
		throw new RangeError("Monster count must be a nonnegative whole number");
	if (count === 0) return [];
	const monsters: Monster[] = [];
	for (const floor of run.floors) {
		const protectedLocations = protectedSpawnLocations(run, floor.floorNumber);
		if (floor.floorNumber === 1)
			protectedLocations.push(
				run.activeFloor === 1 ? run.playerCoordinate : selectPlayerStart(floor),
			);
		const candidates: Coordinate[] = [];
		for (const [row, tiles] of floor.terrain.entries()) {
			for (const [col, tile] of tiles.entries()) {
				const coordinate = { row, col };
				if (
					tile === FLOOR &&
					!protectedLocations.some(
						(point) => orthogonalDistance(point, coordinate) <= 1,
					)
				)
					candidates.push(coordinate);
			}
		}
		const floorCount = count ?? monsterCountForSpace(candidates.length);
		for (let index = 1; index <= floorCount && candidates.length > 0; index++) {
			const random = createSeededRandom(
				hashStringToUint32(
					`${run.seed}:${floor.floorNumber}:monsters:${index}`,
				),
			);
			const [coordinate] = candidates.splice(
				Math.floor(random() * candidates.length),
				1,
			);
			const kind = selectMonsterKind(
				floor.floorNumber,
				createSeededRandom(
					hashStringToUint32(
						`${run.seed}:${floor.floorNumber}:monster-kinds:${index}`,
					),
				),
			);
			if (!kind) break;
			monsters.push({
				id: `${floor.floorNumber}:${index}`,
				kind,
				floorNumber: floor.floorNumber,
				coordinate,
				health: MONSTER_DEFINITIONS[kind].maxHealth,
				intent: { type: "idle" },
				lastDamagedTurn: null,
			});
		}
	}
	return monsters;
};
