import { deriveAttributes } from "./Attributes";
import type { Progression } from "./Progression";

export const BASE_MAXIMUM_MANA = 10;
export const MANA_PER_INTELLIGENCE_MODIFIER = 2;
export const maximumMana = (progression: Progression): number =>
	BASE_MAXIMUM_MANA +
	MANA_PER_INTELLIGENCE_MODIFIER *
		deriveAttributes(progression).intelligenceModifier;

export const growManaCapacity = (
	mana: number,
	before: Progression,
	after: Progression,
): number => mana + maximumMana(after) - maximumMana(before);
