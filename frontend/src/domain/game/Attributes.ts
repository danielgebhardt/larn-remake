import {
	levelForExperience,
	MAX_PLAYER_LEVEL,
	type Progression,
} from "./Progression";

export const BASE_ATTRIBUTE = 10;
const ATTRIBUTE_GAIN = 2;
export const strengthAtLevel = (level: number): number => {
	if (!Number.isInteger(level) || level < 1 || level > MAX_PLAYER_LEVEL)
		throw new RangeError(
			"Attribute growth requires a supported character level.",
		);
	return BASE_ATTRIBUTE + Math.floor((level - 1) / 2) * ATTRIBUTE_GAIN;
};
export const deriveAttributes = (progression: Progression) => {
	const strength = strengthAtLevel(levelForExperience(progression.experience));
	return {
		strength,
		strengthModifier: Math.floor((strength - BASE_ATTRIBUTE) / 2),
	};
};
