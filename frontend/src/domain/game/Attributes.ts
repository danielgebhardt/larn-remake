import { playerEffectBonuses } from "./EffectBonuses";
import {
	levelForExperience,
	MAX_PLAYER_LEVEL,
	type Progression,
} from "./Progression";
import type { TimedEffect } from "./TimedEffects";

export const BASE_ATTRIBUTE = 10;
const ATTRIBUTE_GAIN = 2;
const validateLevel = (level: number): void => {
	if (!Number.isInteger(level) || level < 1 || level > MAX_PLAYER_LEVEL)
		throw new RangeError(
			"Attribute growth requires a supported character level.",
		);
};
export const strengthAtLevel = (level: number): number => {
	validateLevel(level);
	return BASE_ATTRIBUTE + Math.floor((level - 1) / 2) * ATTRIBUTE_GAIN;
};
export const dexterityAtLevel = (level: number): number => {
	validateLevel(level);
	return BASE_ATTRIBUTE + Math.floor(level / 2) * ATTRIBUTE_GAIN;
};
export const intelligenceAtLevel = strengthAtLevel;
export const deriveAttributes = (
	progression: Progression,
	effects: readonly TimedEffect[] = [],
) => {
	const level = levelForExperience(progression.experience);
	const bonuses = playerEffectBonuses(effects);
	const strength = strengthAtLevel(level) + bonuses.strength;
	const dexterity = dexterityAtLevel(level) + bonuses.dexterity;
	const intelligence = intelligenceAtLevel(level);
	return {
		intelligence,
		intelligenceModifier: Math.floor((intelligence - BASE_ATTRIBUTE) / 2),
		strength,
		strengthModifier: Math.floor((strength - BASE_ATTRIBUTE) / 2),
		dexterity,
		dexterityModifier: Math.floor((dexterity - BASE_ATTRIBUTE) / 2),
	};
};
