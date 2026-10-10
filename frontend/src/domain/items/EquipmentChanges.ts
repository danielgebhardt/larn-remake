import { BAG_CAPACITY, type Bag, createBag } from "./Bag";
import {
	createEquipment,
	type Equipment,
	type EquipmentSlot,
	equipmentSlotFor,
} from "./Equipment";
import type { ItemKind } from "./Item";

export type EquipmentAction =
	| { type: "equip"; itemId: string; slot: EquipmentSlot }
	| { type: "unequip"; slot: EquipmentSlot };

export type EquipmentChangeEvent = {
	type: "item-equipped" | "item-unequipped";
	item: ItemKind;
	slot: EquipmentSlot;
	replaced?: ItemKind;
};

type EquipmentChange =
	| { equipment: Equipment; bag: Bag; event: EquipmentChangeEvent }
	| { error: string };

export const changeEquipment = (
	equipment: Equipment,
	bag: Bag,
	action: EquipmentAction,
): EquipmentChange => {
	const current = equipment[action.slot];
	const label = action.slot === "mainHand" ? "Main hand" : "Off hand";
	if (action.type === "unequip") {
		if (!current) return { error: `${label} is already empty.` };
		if (bag.items.length >= BAG_CAPACITY)
			return { error: "Your bag is full. Make room before unequipping gear." };
		if (bag.items.some((item) => item.id === current.id))
			return { error: "That item is already in your bag." };
		return {
			equipment: createEquipment(
				action.slot === "mainHand" ? null : equipment.mainHand,
				action.slot === "offHand" ? null : equipment.offHand,
			),
			bag: createBag([...bag.items, current]),
			event: { type: "item-unequipped", item: current.kind, slot: action.slot },
		};
	}
	const index = bag.items.findIndex((item) => item.id === action.itemId);
	const selected = bag.items[index];
	if (!selected) return { error: "That item is no longer in your bag." };
	if (equipmentSlotFor(selected) !== action.slot)
		return { error: `That item does not fit the ${label.toLowerCase()}.` };
	if (
		[equipment.mainHand, equipment.offHand].some(
			(item) => item?.id === selected.id,
		)
	)
		return { error: "That item is already equipped." };
	const items = [...bag.items];
	if (current) items[index] = current;
	else items.splice(index, 1);
	return {
		equipment: createEquipment(
			action.slot === "mainHand" ? selected : equipment.mainHand,
			action.slot === "offHand" ? selected : equipment.offHand,
		),
		bag: createBag(items),
		event: {
			type: "item-equipped",
			item: selected.kind,
			slot: action.slot,
			...(current ? { replaced: current.kind } : {}),
		},
	};
};
