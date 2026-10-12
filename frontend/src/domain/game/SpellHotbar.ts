import type { SpellKind } from "./Spells";

export const SPELL_SLOTS = [1, 2, 3, 4] as const;
export type SpellSlot = (typeof SPELL_SLOTS)[number];
export type SpellHotbar = readonly (SpellKind | null)[];
export type SpellAssignmentAction = {
	type: "assign-spell";
	slot: SpellSlot;
	spell: SpellKind | null;
};
export const createSpellHotbar = (known: readonly SpellKind[]): SpellHotbar =>
	SPELL_SLOTS.map((_, index) => known[index] ?? null);
export const assignSpell = (
	slots: SpellHotbar,
	known: readonly SpellKind[],
	action: SpellAssignmentAction,
): SpellHotbar | { error: string } => {
	if (!SPELL_SLOTS.includes(action.slot))
		return { error: "Choose a spell slot from 1 to 4." };
	if (action.spell !== null && !known.includes(action.spell))
		return { error: "You have not learned that spell." };
	const next = slots.map((spell, index) =>
		index === action.slot - 1
			? action.spell
			: action.spell !== null && spell === action.spell
				? null
				: spell,
	);
	return next.every((spell, index) => spell === slots[index]) ? slots : next;
};
export const fillNewSpellSlots = (
	slots: SpellHotbar,
	before: readonly SpellKind[],
	after: readonly SpellKind[],
): SpellHotbar => {
	let next = slots;
	for (const spell of after) {
		if (before.includes(spell) || next.includes(spell)) continue;
		const index = next.indexOf(null);
		if (index < 0) break;
		next = next.map((entry, i) => (i === index ? spell : entry));
	}
	return next;
};
