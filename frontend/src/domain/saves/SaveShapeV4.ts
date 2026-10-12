import { SPELL_DEFINITIONS } from "../game/Spells";
import type { SaveDocumentV4 } from "./SaveDocumentV4";
import { isSaveDocumentV3 } from "./SaveShapeV3";
export const isSaveDocumentV4 = (value: unknown): value is SaveDocumentV4 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 4 ||
		!isSaveDocumentV3({ ...value, version: 3 }) ||
		!("state" in value) ||
		typeof value.state !== "object" ||
		value.state === null ||
		!("spellHotbar" in value.state)
	)
		return false;
	const slots = value.state.spellHotbar;
	return (
		Array.isArray(slots) &&
		slots.length === 4 &&
		slots.every(
			(spell) =>
				spell === null ||
				(typeof spell === "string" && Object.hasOwn(SPELL_DEFINITIONS, spell)),
		)
	);
};
