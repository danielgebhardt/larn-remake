import { BAG_CAPACITY, bagSlots } from "../items/Bag";
import {
	EQUIPMENT_SLOT_LABELS,
	type EquipmentSlot,
	fitsEquipmentSlot,
} from "../items/Equipment";
import { ITEM_DEFINITIONS } from "../items/Item";
import {
	MERCHANT_OFFERS,
	type MerchantSupply,
} from "../merchant/MerchantRules";
import { savedLocations, unique } from "./SaveConsistencyHelpers";
import type { SaveSourceDocument } from "./SaveSource";

export const hasConsistentInventory = (
	document: SaveSourceDocument,
): boolean => {
	const { state } = document;
	const { quest } = state;
	const { walkable } = savedLocations(document);
	for (const [slot, item] of Object.entries(state.equipment)) {
		if (
			!Object.hasOwn(EQUIPMENT_SLOT_LABELS, slot) ||
			(item !== null &&
				(typeof item !== "object" ||
					!Object.hasOwn(ITEM_DEFINITIONS, item.kind)))
		)
			return false;
	}
	if (bagSlots(state.bag).length > (document.version >= 11 ? BAG_CAPACITY : 20))
		return false;
	const allItems = [
		...state.bag.items,
		...Object.values(state.equipment).filter((entry) => entry !== null),
		...state.floorItems.map((entry) => entry.item),
	];
	if (!unique(allItems.map((entry) => entry.id))) return false;
	if ("merchantStock" in state)
		for (const item of allItems) {
			if (!item.id.startsWith("merchant:")) continue;
			const parts = item.id.split(":"),
				kind = parts[1],
				index = Number(parts[2]);
			if (
				parts.length !== 3 ||
				kind !== item.kind ||
				!Object.hasOwn(MERCHANT_OFFERS, kind) ||
				!Number.isInteger(index) ||
				index < 1 ||
				index > 10 ||
				String(index) !== parts[2] ||
				index > 10 - state.merchantStock[kind as MerchantSupply]
			)
				return false;
		}

	for (const [name, entry] of Object.entries(state.equipment))
		if (entry && !fitsEquipmentSlot(entry, name as EquipmentSlot)) return false;
	if (
		state.bag.items.some(
			(entry) =>
				entry.kind === "cure" ||
				ITEM_DEFINITIONS[entry.kind].type === "spellbook",
		) ||
		!state.floorItems.every((entry) =>
			walkable(entry.floorNumber, entry.coordinate),
		)
	)
		return false;
	const cures = state.floorItems.filter((entry) => entry.item.kind === "cure");
	if (
		quest.cureRecovered
			? cures.length !== 0
			: cures.length !== 1 || cures[0].floorNumber !== quest.goalFloor
	)
		return false;
	return true;
};
