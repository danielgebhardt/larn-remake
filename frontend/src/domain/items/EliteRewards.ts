import { selectWeighted } from "../content/WeightedSelection";
import { createSeededRandom, hashStringToUint32 } from "../dungeon/Seed";
import type { Monster } from "../monsters/Monster";
import { eligibleLootKinds, ITEM_DEFINITIONS, type ItemKind } from "./Item";
export const selectEliteReward = (
	seed: number,
	monster: Monster,
): ItemKind | undefined => {
	const equipment = eligibleLootKinds(monster.floorNumber, "drop").filter(
		(kind) =>
			["weapon", "shield", "chest-armor", "helmet", "ring"].includes(
				ITEM_DEFINITIONS[kind].type,
			),
	);
	const recent = equipment.filter(
		(kind) =>
			ITEM_DEFINITIONS[kind].minFloor >= Math.floor(monster.floorNumber / 2),
	);
	const pool = recent.length ? recent : equipment;
	return selectWeighted(
		pool.map((kind) => ({
			value: kind,
			weight: ITEM_DEFINITIONS[kind].dropWeight,
		})),
		createSeededRandom(
			hashStringToUint32(
				`${seed}:${monster.floorNumber}:elite-reward:${monster.id}`,
			),
		),
	);
};
