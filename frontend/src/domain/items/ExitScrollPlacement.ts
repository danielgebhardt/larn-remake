import { type DungeonRun, hashStringToUint32 } from "../dungeon/DungeonRun";
import { createSeededRandom } from "../dungeon/Seed";
import type { Monster } from "../monsters/Monster";
import type { FloorItem } from "./FloorItems";
import { availableItemLocations } from "./ItemPlacement";

export const EXIT_SCROLL_FIND_CHANCE = 0.15;
// Separate stream: adding scrolls does not reroll ordinary items or books.
export const spawnRunExitScrolls = (
	run: DungeonRun,
	monsters: readonly Monster[],
	occupied: readonly FloorItem[],
): readonly FloorItem[] => {
	const scrolls: FloorItem[] = [];
	for (const floor of run.floors) {
		if (floor.floorNumber < 2) continue;
		const random = createSeededRandom(
			hashStringToUint32(`${run.seed}:${floor.floorNumber}:exit-scroll`),
		);
		if (random() >= EXIT_SCROLL_FIND_CHANCE) continue;
		const candidates = availableItemLocations(run, floor, monsters, occupied);
		if (!candidates.length) continue;
		scrolls.push({
			item: {
				id: `floor:${floor.floorNumber}:exit-scroll`,
				kind: "exit-scroll",
			},
			floorNumber: floor.floorNumber,
			coordinate: candidates[Math.floor(random() * candidates.length)],
		});
	}
	return scrolls;
};
