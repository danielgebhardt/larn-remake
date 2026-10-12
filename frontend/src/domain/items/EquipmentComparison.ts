import { type Equipment, equipmentSlotFor } from "./Equipment";
import { ITEM_DEFINITIONS, type ItemInstance } from "./Item";

export const compareEquipment = (item: ItemInstance, equipment: Equipment) => {
	if (ITEM_DEFINITIONS[item.kind].type === "ring") return null;
	const slot = equipmentSlotFor(item);
	if (!slot) return null;
	const stat = slot === "mainHand" ? "Attack bonus" : "Armor";
	const contribution = (gear: ItemInstance | null) => {
		if (!gear) return 0;
		const definition = ITEM_DEFINITIONS[gear.kind];
		return slot === "mainHand" ? definition.attackBonus : definition.armor;
	};
	const carriedValue = contribution(item);
	const equippedValue = contribution(equipment[slot]);
	const delta = carriedValue - equippedValue;
	const label = delta > 0 ? "Better" : delta < 0 ? "Lower" : "Same";
	return { slot, stat, carriedValue, equippedValue, delta, label } as const;
};
