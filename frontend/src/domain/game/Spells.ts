import { deriveAttributes } from "./Attributes";
import type { Progression } from "./Progression";
import type { EffectKind } from "./TimedEffects";

type SpellDetails = { name: string; cost: number; description: string };
export type SpellDefinition = SpellDetails &
	(
		| {
				mode: "targeted";
				effect: "damage";
				range: number;
				minimumDamage: number;
				maximumDamage: number;
				condition?: EffectKind;
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
	"ember-bolt": {
		name: "Ember Bolt",
		mode: "targeted",
		effect: "damage",
		cost: 4,
		range: 4,
		minimumDamage: 3,
		maximumDamage: 7,
		description:
			"A short-range burst of flame. More forceful than Magic Missile, but costs more mana.",
	},
	"frost-bolt": {
		name: "Frost Bolt",
		mode: "targeted",
		effect: "damage",
		cost: 4,
		range: 5,
		minimumDamage: 2,
		maximumDamage: 4,
		condition: "slowed",
		description:
			"Chill one monster for three active phases. It skips alternating actions, starting with this cast; recasting refreshes the slow.",
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
