import { EQUIPMENT_SLOT_LABELS } from "../items/Equipment";
import { isEnchantableKind, MAX_ENCHANTMENT } from "../items/ItemValues";
import type { SaveDocumentV18 } from "./SaveDocumentV18";
import { isSaveDocumentV17 } from "./SaveShapeV17";
export const isSaveDocumentV18 = (value: unknown): value is SaveDocumentV18 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 18 ||
		!isSaveDocumentV17({ ...value, version: 17 })
	)
		return false;
	const current = value as SaveDocumentV18;
	if (
		!Object.keys(current.state.equipment).every((slot) =>
			Object.hasOwn(EQUIPMENT_SLOT_LABELS, slot),
		)
	)
		return false;
	const items = [
		...current.state.bag.items,
		...Object.values(current.state.equipment).filter((item) => item !== null),
		...current.state.floorItems.map((entry) => entry.item),
	];
	return items.every(
		(item) =>
			item.enchantment === undefined ||
			(Number.isInteger(item.enchantment) &&
				item.enchantment >= 1 &&
				item.enchantment <= MAX_ENCHANTMENT &&
				isEnchantableKind(item.kind)),
	);
};
