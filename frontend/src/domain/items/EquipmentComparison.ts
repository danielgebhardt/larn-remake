import {
	type Equipment,
	type EquipmentSlot,
	equipmentSlotsFor,
} from "./Equipment";
import {
	ITEM_DEFINITIONS,
	type ItemDefinition,
	type ItemInstance,
} from "./Item";

const contributions = (item: ItemInstance | null) => {
	const definition: ItemDefinition | undefined = item
		? ITEM_DEFINITIONS[item.kind]
		: undefined;
	const stats = definition?.stats;
	return {
		"Attack bonus":
			(definition?.attackBonus ?? 0) + Math.floor((stats?.strength ?? 0) / 2),
		Armor: definition?.armor ?? 0,
		Strength: stats?.strength ?? 0,
		Dexterity: stats?.dexterity ?? 0,
		Intelligence: stats?.intelligence ?? 0,
		"Health capacity": stats?.health ?? 0,
		"Mana capacity":
			(stats?.mana ?? 0) + 2 * Math.floor((stats?.intelligence ?? 0) / 2),
	};
};
const compareSlot = (
	item: ItemInstance,
	equipment: Equipment,
	slot: EquipmentSlot,
) => {
	const carried = contributions(item);
	const equipped = contributions(equipment[slot]);
	const primary =
		ITEM_DEFINITIONS[item.kind].type === "weapon" ? "Attack bonus" : "Armor";
	const changes = (Object.keys(carried) as (keyof typeof carried)[])
		.filter(
			(stat) =>
				carried[stat] !== 0 ||
				equipped[stat] !== 0 ||
				(stat === primary && ITEM_DEFINITIONS[item.kind].type !== "ring"),
		)
		.map((stat) => ({
			stat,
			carriedValue: carried[stat],
			equippedValue: equipped[stat],
			delta: carried[stat] - equipped[stat],
		}));
	const gains = changes.some((change) => change.delta > 0);
	const losses = changes.some((change) => change.delta < 0);
	const label =
		gains && losses ? "Tradeoff" : gains ? "Better" : losses ? "Lower" : "Same";
	const first = changes[0] ?? {
		stat: primary,
		carriedValue: 0,
		equippedValue: 0,
		delta: 0,
	};
	return { slot, ...first, label, changes } as const;
};
// Bag badges choose the most useful compatible slot. Details explicitly show
// each slot, so a useful empty ring slot never gets compared only with the other hand.
export const compareEquipment = (
	item: ItemInstance,
	equipment: Equipment,
	requestedSlot?: EquipmentSlot,
) => {
	const slots = equipmentSlotsFor(item);
	if (!slots.length || (requestedSlot && !slots.includes(requestedSlot)))
		return null;
	if (requestedSlot) return compareSlot(item, equipment, requestedSlot);
	const rank = { Better: 3, Same: 2, Tradeoff: 1, Lower: 0 };
	return slots
		.map((slot) => compareSlot(item, equipment, slot))
		.sort((a, b) => rank[b.label] - rank[a.label])[0];
};
