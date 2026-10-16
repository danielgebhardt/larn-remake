import type { Equipment } from "../items/Equipment";
import { deriveAttributes } from "./Attributes";
import type { Progression } from "./Progression";
import type { TimedEffect } from "./TimedEffects";

// Conditions consult current attributes at each phase; saved timers stay authoritative.
export const ongoingSpellPotency = (
	progression: Progression,
	equipment?: Partial<Equipment>,
	effects: readonly TimedEffect[] = [],
) => {
	const scaling = Math.floor(
		deriveAttributes(progression, effects, equipment).intelligenceModifier / 2,
	);
	return { renewalHealing: 2 + scaling, poisonDamage: 4 + scaling };
};
