import { selectPlayerStart } from "../dungeon/DungeonLocations.ts";
import { type DungeonRun, hashStringToUint32 } from "../dungeon/DungeonRun.ts";
import type { Coordinate } from "../dungeon/DungeonTypes.ts";
import { createSeededRandom } from "../dungeon/Seed.ts";
import { FLOOR } from "../dungeon/Tiles.ts";
import { MONSTER_DEFINITIONS, type Monster } from "./Monster.ts";

export const spawnRunMonsters = (run: DungeonRun): readonly Monster[] => {
	const floor = run.floors[0];
	const start =
		run.activeFloor === 1 ? run.playerCoordinate : selectPlayerStart(floor);
	const excluded = [
		start,
		floor.upStair?.coordinate,
		floor.downStair?.coordinate,
	];
	const candidates: Coordinate[] = [];
	for (const [row, tiles] of floor.terrain.entries()) {
		for (const [col, tile] of tiles.entries()) {
			if (
				tile === FLOOR &&
				!excluded.some((point) => point?.row === row && point.col === col)
			) {
				candidates.push({ row, col });
			}
		}
	}
	if (candidates.length === 0) return [];
	const random = createSeededRandom(
		hashStringToUint32(`${run.seed}:${floor.floorNumber}:monsters:1`),
	);
	return [
		{
			id: `${floor.floorNumber}:1`,
			kind: "goblin",
			floorNumber: floor.floorNumber,
			coordinate: candidates[Math.floor(random() * candidates.length)],
			health: MONSTER_DEFINITIONS.goblin.maxHealth,
		},
	];
};
