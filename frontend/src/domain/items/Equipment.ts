import { ITEM_DEFINITIONS, type ItemInstance } from "./Item";

export type Equipment = Readonly<{
	mainHand: ItemInstance | null;
	offHand: ItemInstance | null;
}>;
export type EquipmentSlot = keyof Equipment;

export const equipmentSlotFor = (item: ItemInstance): EquipmentSlot | null => {
	switch (ITEM_DEFINITIONS[item.kind].type) {
		case "weapon":
			return "mainHand";
		case "shield":
			return "offHand";
		case "potion":
			return null;
	}
};

export const createEquipment = (
	mainHand: ItemInstance | null = null,
	offHand: ItemInstance | null = null,
): Equipment => {
	if (mainHand && offHand && mainHand.id === offHand.id)
		throw new Error("The same item cannot occupy both equipment slots.");
	if (mainHand && ITEM_DEFINITIONS[mainHand.kind].type !== "weapon")
		throw new Error("The main hand only supports melee weapons.");
	if (offHand && ITEM_DEFINITIONS[offHand.kind].type !== "shield")
		throw new Error("The off hand only supports shields.");
	return { mainHand, offHand };
};

export const createStartingEquipment = (): Equipment =>
	createEquipment(
		{ id: "starting:main-hand", kind: "short-sword" },
		{ id: "starting:off-hand", kind: "wooden-shield" },
	);
