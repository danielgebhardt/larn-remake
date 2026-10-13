import {
	eligibleLootKinds,
	ITEM_DEFINITIONS,
	type ItemKind,
	type LootSource,
} from "./Item";

// Plain gear competes within its slot. Stat-bearing gear and rings keep their
// tradeoff weights; retaining the gear band's total avoids changing supply odds.
const plainGear = (kind: ItemKind) => {
	const definition = ITEM_DEFINITIONS[kind];
	return (
		["weapon", "shield", "chest-armor", "helmet"].includes(definition.type) &&
		!("stats" in definition)
	);
};
const value = (kind: ItemKind) =>
	ITEM_DEFINITIONS[kind].attackBonus + ITEM_DEFINITIONS[kind].armor;
export const lootWeights = (
	floor: number,
	source: LootSource,
	preferences: Partial<Record<ItemKind, number>> = {},
	depthAdjusted = true,
): { value: ItemKind; weight: number }[] => {
	const entries = eligibleLootKinds(floor, source)
		.map((kind) => ({
			value: kind,
			weight:
				ITEM_DEFINITIONS[kind][
					source === "found" ? "foundWeight" : "dropWeight"
				] * (preferences[kind] ?? 1),
		}))
		.filter((entry) => entry.weight > 0);
	if (!depthAdjusted) return entries;
	const gear = entries.filter((entry) => plainGear(entry.value));
	const adjusted = gear.map((entry) => {
		const best = Math.max(
			...gear
				.filter(
					(other) =>
						ITEM_DEFINITIONS[other.value].type ===
						ITEM_DEFINITIONS[entry.value].type,
				)
				.map((other) => value(other.value)),
		);
		return {
			...entry,
			weight: entry.weight / (1 + 2 * (best - value(entry.value))),
		};
	});
	const originalTotal = gear.reduce((sum, entry) => sum + entry.weight, 0);
	const adjustedTotal = adjusted.reduce((sum, entry) => sum + entry.weight, 0);
	if (!adjustedTotal) return entries;
	const weights = new Map(
		adjusted.map((entry) => [
			entry.value,
			(entry.weight * originalTotal) / adjustedTotal,
		]),
	);
	return entries.map((entry) => ({
		...entry,
		weight: weights.get(entry.value) ?? entry.weight,
	}));
};
