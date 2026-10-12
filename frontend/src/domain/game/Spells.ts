import { deriveAttributes } from "./Attributes";
import type { Progression } from "./Progression";

type SpellDetails = { name: string; cost: number; description: string };
export type SpellDefinition = SpellDetails &
	(
		| {
				mode: "targeted";
				effect: "damage";
				range: number;
				minimumDamage: number;
				maximumDamage: number;
		  }
		| { mode: "self"; effect: "heal"; healing: number }
	);

export const SPELL_DEFINITIONS = {
	"magic-missile": {
		name: "Magic Missile",
		mode: "targeted",
		effect: "damage",
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
		effect: "heal",
		cost: 4,
		healing: 4,
		description: "Restore your own health before monsters act.",
	},
} as const satisfies Record<string, SpellDefinition>;
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
export const spellPotency = (
	progression: Progression,
	definition: SpellDefinition,
) => {
	const modifier = deriveAttributes(progression).intelligenceModifier;
	switch (definition.effect) {
		case "damage":
			return {
				effect: "damage",
				minimumDamage: definition.minimumDamage + modifier,
				maximumDamage: definition.maximumDamage + modifier,
			} as const;
		case "heal":
			return {
				effect: "heal",
				healing: definition.healing + modifier,
			} as const;
	}
};
