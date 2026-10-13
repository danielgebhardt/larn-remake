import { type Difficulty, scaleEnemyValue } from "../game/Difficulty";
import { attackProfile, MONSTER_HIT_THRESHOLD } from "../game/MeleeRules";
import { MONSTER_DEFINITIONS, type MonsterKind } from "./Monster";

export const maximumMonsterHealth = (
	kind: MonsterKind,
	difficulty: Difficulty = 1,
): number => scaleEnemyValue(MONSTER_DEFINITIONS[kind].maxHealth, difficulty);
export const monsterDamageRange = (
	kind: MonsterKind,
	difficulty: Difficulty = 1,
) => {
	const raw = attackProfile(
		MONSTER_DEFINITIONS[kind].attackDamage,
		MONSTER_HIT_THRESHOLD,
	);
	return {
		minDamage: scaleEnemyValue(raw.minDamage, difficulty),
		maxDamage: scaleEnemyValue(raw.maxDamage, difficulty),
	};
};
