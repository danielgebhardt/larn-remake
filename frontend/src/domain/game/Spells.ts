import { deriveAttributes } from "./Attributes";
import type { Progression } from "./Progression";

export const SPELL_DEFINITIONS = {
	"magic-missile": {
		name: "Magic Missile",
		mode: "targeted",
		cost: 3,
		range: 6,
		minimumDamage: 3,
		maximumDamage: 5,
		description:
			"A homing bolt that always hits one monster within range and clear line of sight.",
	},
	heal: {
		name: "Heal",
		mode: "self",
		cost: 4,
		healing: 4,
		description: "Restore your own health before monsters act.",
	},
} as const;
export type SpellKind = keyof typeof SPELL_DEFINITIONS;
export const createKnownSpells = (): readonly SpellKind[] => [
	"magic-missile",
	"heal",
];
export const spellKnowledgeError = (
	known: readonly SpellKind[],
	spell: string,
): string | undefined => {
	if (!Object.hasOwn(SPELL_DEFINITIONS, spell)) return "Unknown spell.";
	if (!known.includes(spell as SpellKind))
		return "You have not learned that spell.";
};
export const spellPotency = (progression: Progression) => {
	const modifier = deriveAttributes(progression).intelligenceModifier;
	return {
		minimumDamage: SPELL_DEFINITIONS["magic-missile"].minimumDamage + modifier,
		maximumDamage: SPELL_DEFINITIONS["magic-missile"].maximumDamage + modifier,
		healing: SPELL_DEFINITIONS.heal.healing + modifier,
	};
};
