import type { GameState } from "../game/GameState";
import { compareEquipment } from "../items/EquipmentComparison";
import type { ItemInstance } from "../items/Item";
import { equipmentSalePrice } from "./MerchantRules";

export const isLowerEquipmentForSale = (
	item: ItemInstance,
	state: GameState,
): boolean =>
	equipmentSalePrice(item) !== null &&
	compareEquipment(item, state)?.label === "Lower";

export const lowerEquipmentSale = (state: GameState) => {
	const items = state.bag.items.filter((item) =>
		isLowerEquipmentForSale(item, state),
	);
	return {
		items,
		gold: items.reduce(
			(total, item) => total + (equipmentSalePrice(item) ?? 0),
			0,
		),
	};
};
