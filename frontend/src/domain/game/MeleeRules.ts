import { resolveIncomingDamage } from "./CombatStats";

export const PLAYER_HIT_THRESHOLD = 4;
export const MONSTER_HIT_THRESHOLD = 5;
export type AttackProfile = {
	hitThreshold: number;
	minDamage: number;
	maxDamage: number;
};
export type MeleeRolls = {
	d20: () => number;
	damage: (min: number, max: number) => number;
};
export type MeleeOutcome = { hit: boolean; damage: number };
const validateProfile = (profile: AttackProfile): void => {
	if (
		!Number.isInteger(profile.hitThreshold) ||
		profile.hitThreshold < 1 ||
		profile.hitThreshold > 20 ||
		!Number.isInteger(profile.minDamage) ||
		profile.minDamage < 1 ||
		!Number.isInteger(profile.maxDamage) ||
		profile.maxDamage < profile.minDamage
	)
		throw new RangeError("Invalid attack threshold or damage range.");
};
export const attackProfile = (
	nominalDamage: number,
	hitThreshold: number,
): AttackProfile => {
	if (!Number.isInteger(nominalDamage) || nominalDamage < 1)
		throw new RangeError("Nominal damage must be a positive whole number.");
	const profile = {
		hitThreshold,
		minDamage: Math.max(1, nominalDamage - 1),
		maxDamage: nominalDamage + 1,
	};
	validateProfile(profile);
	return profile;
};
export const resolveMeleeAttack = (
	profile: AttackProfile,
	rolls: MeleeRolls,
	armor = 0,
): MeleeOutcome => {
	validateProfile(profile);
	if (!Number.isInteger(armor) || armor < 0)
		throw new RangeError("Armor must be a nonnegative whole number.");
	const hitRoll = rolls.d20();
	if (!Number.isInteger(hitRoll) || hitRoll < 1 || hitRoll > 20)
		throw new RangeError("A D20 roll must be between 1 and 20.");
	if (hitRoll < profile.hitThreshold) return { hit: false, damage: 0 };
	const raw = rolls.damage(profile.minDamage, profile.maxDamage);
	if (
		!Number.isInteger(raw) ||
		raw < profile.minDamage ||
		raw > profile.maxDamage
	)
		throw new RangeError("Damage roll is outside the attack range.");
	return { hit: true, damage: resolveIncomingDamage(raw, armor) };
};
