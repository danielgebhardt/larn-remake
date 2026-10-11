import { selectWeighted } from "../content/WeightedSelection";
import {
	eligibleLootKinds,
	ITEM_DEFINITIONS,
	type ItemKind,
	type LootSource,
} from "./Item";

export const selectLootKind = (
	floor: number,
	source: LootSource,
	random: () => number,
	preferences: Partial<Record<ItemKind, number>> = {},
): ItemKind | undefined => {
	const entries = eligibleLootKinds(floor, source).map((kind) => ({
		value: kind,
		weight:
			ITEM_DEFINITIONS[kind][
				source === "found" ? "foundWeight" : "dropWeight"
			] * (preferences[kind] ?? 1),
	}));
	return selectWeighted(
		entries.filter((entry) => entry.weight > 0),
		random,
	);
};
