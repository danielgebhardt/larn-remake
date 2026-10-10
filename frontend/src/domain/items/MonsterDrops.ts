import { hashStringToUint32 } from "../dungeon/DungeonRun";
import { createSeededRandom } from "../dungeon/Seed";
import type { Monster } from "../monsters/Monster";
import type { FloorItem } from "./FloorItems";
import { selectLootKind } from "./Loot";

export const GOBLIN_DROP_CHANCE = 0.5;
export const createMonsterDrop = (
	seed: number,
	monster: Monster,
): FloorItem | undefined => {
	const random = createSeededRandom(
		hashStringToUint32(
			`${seed}:${monster.floorNumber}:monster-drops:${monster.id}`,
		),
	);
	if (random() >= GOBLIN_DROP_CHANCE) return undefined;
	return {
		item: { id: `monster:${monster.id}:loot`, kind: selectLootKind(random) },
		floorNumber: monster.floorNumber,
		coordinate: { ...monster.coordinate },
	};
};
