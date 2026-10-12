import type { Equipment } from "../items/Equipment";
import { deriveAttributes } from "./Attributes";
import type { Progression } from "./Progression";
import type { EffectKind, PlayerEffectKind } from "./TimedEffects";

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
				lifeDrain?: boolean;
				radius?: number;
		  }
		| {
				mode: "targeted";
				effect: "condition";
				condition: EffectKind;
				range: number;
		  }
		| { mode: "self"; effect: "condition"; condition: PlayerEffectKind }
		| { mode: "self"; effect: "heal"; healing: number }
		| {
				mode: "self";
				effect: "damage";
				radius: number;
				minimumDamage: number;
				maximumDamage: number;
				condition?: EffectKind;
		  }
		| { mode: "self"; effect: "reposition"; range: number }
		| { mode: "targeted"; effect: "reposition"; range: number }
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
	shock: {
		name: "Shock",
		mode: "targeted",
		effect: "damage",
		cost: 5,
		range: 5,
		minimumDamage: 5,
		maximumDamage: 8,
		description:
			"A focused jolt with stronger damage than Magic Missile at a higher mana cost.",
	},
	"stone-lance": {
		name: "Stone Lance",
		mode: "targeted",
		effect: "damage",
		cost: 6,
		range: 7,
		minimumDamage: 6,
		maximumDamage: 10,
		description:
			"A heavy stone projectile with a longer reach and substantial mana cost.",
	},
	"sonic-spear": {
		name: "Sonic Spear",
		mode: "targeted",
		effect: "damage",
		cost: 8,
		range: 8,
		minimumDamage: 8,
		maximumDamage: 13,
		description: "A powerful long-range strike for the deeper dungeon.",
	},
	"drain-life": {
		name: "Drain Life",
		mode: "targeted",
		effect: "damage",
		cost: 6,
		range: 2,
		minimumDamage: 4,
		maximumDamage: 8,
		lifeDrain: true,
		description:
			"A close-range attack that restores health equal to actual damage dealt, up to your missing health.",
	},

	web: {
		name: "Web",
		mode: "targeted",
		effect: "condition",
		condition: "rooted",
		cost: 3,
		range: 4,
		description:
			"Web one monster for three active phases. It cannot move, but can still attack if in range.",
	},
	sleep: {
		name: "Sleep",
		mode: "targeted",
		effect: "condition",
		condition: "asleep",
		cost: 5,
		range: 4,
		description:
			"Put one monster to sleep for three active phases. Any damage wakes it before its response. Cancels prepared attacks.",
	},
	fear: {
		name: "Fear",
		mode: "targeted",
		effect: "condition",
		condition: "afraid",
		cost: 4,
		range: 5,
		description:
			"Force one monster to retreat for three active phases instead of attacking. Cancels prepared attacks; blocked escape still consumes its action.",
	},

	"poison-dart": {
		name: "Poison Dart",
		mode: "targeted",
		effect: "damage",
		condition: "poisoned",
		cost: 4,
		range: 5,
		minimumDamage: 1,
		maximumDamage: 2,
		description:
			"Deal a small initial hit and poison a monster for three active phases. Poison deals 2 damage after its action; refreshing never stacks.",
	},
	renewal: {
		name: "Renewal",
		mode: "self",
		effect: "condition",
		condition: "renewing",
		cost: 5,
		description:
			"Restore 2 health after monsters act for four committed turns, including this turn. Does not save you from a fatal hit.",
	},
	protection: {
		name: "Protection",
		mode: "self",
		effect: "condition",
		condition: "protected",
		cost: 3,
		description:
			"Gain 2 armor for six committed turns, including this turn. Recasting refreshes the duration without stacking.",
	},
	strength: {
		name: "Strength",
		mode: "self",
		effect: "condition",
		condition: "strengthened",
		cost: 4,
		description:
			"Gain 2 Strength for six committed turns, improving melee damage. Recasting refreshes the duration without stacking.",
	},
	dexterity: {
		name: "Dexterity",
		mode: "self",
		effect: "condition",
		condition: "nimble",
		cost: 4,
		description:
			"Gain 2 Dexterity for six committed turns, improving hit and evasion chances. Recasting refreshes the duration without stacking.",
	},
	blink: {
		name: "Blink",
		mode: "self",
		effect: "reposition",
		range: 3,
		cost: 4,
		description:
			"Blink to a seeded safe tile within three steps. Walls, actors and stair arrivals are excluded. No destination costs nothing.",
	},
	"teleport-away": {
		name: "Teleport Away",
		mode: "targeted",
		effect: "reposition",
		range: 5,
		cost: 6,
		description:
			"Send one monster to a seeded safe tile farther from you on this floor. Keeps its health and conditions, cancels its prepared attack.",
	},
	fireball: {
		name: "Fireball",
		mode: "targeted",
		effect: "damage",
		cost: 8,
		range: 6,
		radius: 1,
		minimumDamage: 6,
		maximumDamage: 10,
		description:
			"Explode around one monster, hitting enemies within one step of it. Walls block the blast; no friendly fire. One turn and one mana cost.",
	},
	"frost-nova": {
		name: "Frost Nova",
		mode: "self",
		effect: "damage",
		cost: 8,
		radius: 2,
		minimumDamage: 3,
		maximumDamage: 5,
		condition: "slowed",
		description:
			"Chill visible-in-wall-sight enemies within two steps of you. Deals damage and slows survivors for three phases. No enemies costs nothing.",
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
	equipment?: Partial<Equipment>,
) => {
	const modifier = deriveAttributes(
		progression,
		[],
		equipment,
	).intelligenceModifier;
	switch (definition.effect) {
		case "damage":
			return {
				effect: "damage",
				minimumDamage: definition.minimumDamage + modifier,
				maximumDamage: definition.maximumDamage + modifier,
			} as const;
		case "condition":
			return { effect: "condition", condition: definition.condition } as const;
		case "reposition":
			return { effect: "reposition" } as const;
		case "heal":
			return {
				effect: "heal",
				healing: definition.healing + modifier,
			} as const;
	}
};
