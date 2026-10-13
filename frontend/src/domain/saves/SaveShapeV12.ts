import { SPELL_DEFINITIONS } from "../game/Spells";
import type { SaveDocumentV12 } from "./SaveDocumentV12";
import { isSaveDocumentV11 } from "./SaveShapeV11";
export const isSaveDocumentV12 = (value: unknown): value is SaveDocumentV12 => {
	if (
		typeof value !== "object" ||
		value === null ||
		!("version" in value) ||
		value.version !== 12 ||
		!("state" in value) ||
		typeof value.state !== "object" ||
		value.state === null ||
		!("spellHotbar" in value.state)
	)
		return false;
	const slots = value.state.spellHotbar;
	if (
		!Array.isArray(slots) ||
		slots.length !== 6 ||
		!slots.every(
			(spell) =>
				spell === null ||
				(typeof spell === "string" && Object.hasOwn(SPELL_DEFINITIONS, spell)),
		)
	)
		return false;
	// Check unchanged fields under v11's contract; validate the original six slots above and semantically afterward.
	return isSaveDocumentV11({
		...value,
		version: 11,
		state: { ...value.state, spellHotbar: [null, null, null, null] },
	});
};
