import { ITEM_DEFINITIONS } from "../items/Item";
import type { SaveDocumentV6 } from "./SaveDocumentV6";
import { isSaveDocumentV5 } from "./SaveShapeV5";

const isRingSlot = (value: unknown): boolean =>
	value === null ||
	(typeof value === "object" &&
		value !== null &&
		"id" in value &&
		typeof value.id === "string" &&
		value.id.length > 0 &&
		value.id.length <= 200 &&
		"kind" in value &&
		typeof value.kind === "string" &&
		Object.hasOwn(ITEM_DEFINITIONS, value.kind));
export const isSaveDocumentV6 = (value: unknown): value is SaveDocumentV6 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 6 ||
		!isSaveDocumentV5({ ...value, version: 5 })
	)
		return false;
	const equipment = (value as SaveDocumentV6).state.equipment;
	return isRingSlot(equipment.leftRing) && isRingSlot(equipment.rightRing);
};
