import { ITEM_DEFINITIONS } from "../src/domain/items/Item";
import { MERCHANT_OFFERS } from "../src/domain/merchant/MerchantRules";

const restoration = (supplies) =>
	Object.entries(supplies).reduce(
		(total, [kind, count]) => {
			const definition = ITEM_DEFINITIONS[kind];
			if ("recovery" in definition)
				total[definition.recovery.resource] +=
					definition.recovery.amount * count;
			return total;
		},
		{ health: 0, mana: 0 },
	);
// Generated ordinary supply potential; excludes elites, return and discoveries.
export const rewardBudget = (state, createDrop, chestReward) => {
	const sources = { found: 0, drop: 0, chest: 0 };
	const floors = state.run.floors.map((floor) => ({
		floor: floor.floorNumber,
		supplies: {},
		restoration: { health: 0, mana: 0 },
		fountains: state.objects.filter(
			(object) =>
				object.floorNumber === floor.floorNumber &&
				object.kind === "fountain" &&
				!object.activated,
		).length,
	}));
	const add = (entry, source) => {
		if (!entry || ITEM_DEFINITIONS[entry.item.kind].type !== "potion") return;
		const floor = floors.find((floor) => floor.floor === entry.floorNumber);
		if (!floor) return;
		floor.supplies[entry.item.kind] =
			(floor.supplies[entry.item.kind] ?? 0) + 1;
		sources[source]++;
	};
	for (const entry of state.floorItems) add(entry, "found");
	for (const actor of state.monsters)
		if (
			actor.health > 0 &&
			actor.kind !== "iron-champion" &&
			Number(actor.id.split(":")[1]) < 10001
		)
			add(createDrop(state.run.seed, { ...actor, health: 0 }), "drop");
	for (const object of state.objects)
		if (object.kind === "chest" && !object.activated)
			add(chestReward(state.run.seed, object), "chest");
	for (const floor of floors) floor.restoration = restoration(floor.supplies);
	return {
		sources,
		floors,
		merchant: {
			locations: state.objects
				.filter((object) => object.kind === "merchant")
				.map((object) => object.floorNumber),
			bottles: Object.values(state.merchantStock).reduce(
				(sum, count) => sum + count,
				0,
			),
			restoration: restoration(state.merchantStock),
			totalCost: Object.entries(state.merchantStock).reduce(
				(sum, [kind, count]) => sum + count * MERCHANT_OFFERS[kind].price,
				0,
			),
		},
	};
};
