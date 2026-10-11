import { ITEM_DEFINITIONS, type ItemInstance } from "./Item";

export const EQUIPMENT_SLOT_LABELS = {
	mainHand: "Main hand",
	offHand: "Off hand",
	chest: "Chest",
	head: "Head",
} as const;
export type EquipmentSlot = keyof typeof EQUIPMENT_SLOT_LABELS;
export type Equipment = Readonly<Record<EquipmentSlot, ItemInstance | null>>;

export const equipmentSlotFor = (item: ItemInstance): EquipmentSlot | null => {
	switch (ITEM_DEFINITIONS[item.kind].type) {
		case "weapon":
			return "mainHand";
		case "shield":
			return "offHand";
		case "chest-armor":
			return "chest";
		case "helmet":
			return "head";
		case "potion":
			return null;
	}
};
export const createEquipment = (
	mainHand: ItemInstance | null = null,
	offHand: ItemInstance | null = null,
	chest: ItemInstance | null = null,
	head: ItemInstance | null = null,
): Equipment => {
	const equipment = { mainHand, offHand, chest, head };
	const items = Object.values(equipment).filter((item) => item !== null);
	if (new Set(items.map((item) => item.id)).size !== items.length)
		throw new Error("The same item cannot occupy multiple equipment slots.");
	for (const slot of Object.keys(equipment) as EquipmentSlot[]) {
		const item = equipment[slot];
		if (item && equipmentSlotFor(item) !== slot)
			throw new Error(
				`That item does not fit the ${EQUIPMENT_SLOT_LABELS[slot].toLowerCase()}.`,
			);
	}
	return equipment;
};
export const replaceEquipmentSlot = (
	equipment: Equipment,
	slot: EquipmentSlot,
	item: ItemInstance | null,
): Equipment => {
	const next = { ...equipment, [slot]: item };
	return createEquipment(next.mainHand, next.offHand, next.chest, next.head);
};
export const createStartingEquipment = (): Equipment =>
	createEquipment(
		{ id: "starting:main-hand", kind: "short-sword" },
		{ id: "starting:off-hand", kind: "wooden-shield" },
	);
