import { selectPlayerStart } from "../dungeon/DungeonLocations";
import { type DungeonRun, hashStringToUint32 } from "../dungeon/DungeonRun";
import type { Coordinate } from "../dungeon/DungeonTypes";
import { createSeededRandom } from "../dungeon/Seed";
import { FLOOR } from "../dungeon/Tiles";
import type { Monster } from "../monsters/Monster";
import { protectedFloorLocations } from "../monsters/MonsterLocations";
import type { FloorItem } from "./FloorItems";
import { selectLootKind } from "./Loot";

export const DEFAULT_ITEMS_PER_FLOOR = 2;
export const spawnRunItems = (
	run: DungeonRun,
	monsters: readonly Monster[],
	count = DEFAULT_ITEMS_PER_FLOOR,
): readonly FloorItem[] => {
	if (!Number.isInteger(count) || count < 0)
		throw new RangeError("Item count must be a nonnegative whole number.");
	const items: FloorItem[] = [];
	for (const floor of run.floors) {
		const protectedLocations = protectedFloorLocations(run, floor.floorNumber);
		if (floor.floorNumber === 1 && floor.rooms.length > 0)
			protectedLocations.push(
				run.activeFloor === 1 ? run.playerCoordinate : selectPlayerStart(floor),
			);
		const candidates: Coordinate[] = [];
		const seen = new Set<string>();
		for (const room of floor.rooms) {
			for (let row = room.startRow; row <= room.endRow; row++) {
				for (let col = room.startCol; col <= room.endCol; col++) {
					const key = `${row}:${col}`;
					if (seen.has(key) || floor.terrain[row]?.[col] !== FLOOR) continue;
					seen.add(key);
					if (
						protectedLocations.some(
							(point) => point.row === row && point.col === col,
						)
					)
						continue;
					if (
						monsters.some(
							(monster) =>
								monster.floorNumber === floor.floorNumber &&
								monster.coordinate.row === row &&
								monster.coordinate.col === col,
						)
					)
						continue;
					candidates.push({ row, col });
				}
			}
		}
		for (let index = 1; index <= count && candidates.length > 0; index++) {
			const random = createSeededRandom(
				hashStringToUint32(`${run.seed}:${floor.floorNumber}:items:${index}`),
			);
			const [coordinate] = candidates.splice(
				Math.floor(random() * candidates.length),
				1,
			);
			items.push({
				item: {
					id: `floor:${floor.floorNumber}:item:${index}`,
					kind: selectLootKind(random),
				},
				floorNumber: floor.floorNumber,
				coordinate,
			});
		}
	}
	return items;
};
