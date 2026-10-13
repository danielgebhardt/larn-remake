import { canAddToBag } from "../src/domain/items/Bag";
import { emptyEquipmentSlotFor } from "../src/domain/items/Equipment";
import { ITEM_DEFINITIONS } from "../src/domain/items/Item";
export const canReviewPickUp = (state, item) => {
	const definition = ITEM_DEFINITIONS[item.kind];
	if (item.kind === "cure") return !state.quest.cureRecovered;
	if (definition.type === "spellbook")
		return !state.knownSpells.includes(definition.teaches);
	return (
		emptyEquipmentSlotFor(state.equipment, item) !== undefined ||
		canAddToBag(state.bag, item)
	);
};
