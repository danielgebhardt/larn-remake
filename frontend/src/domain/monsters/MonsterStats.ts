import { type Difficulty, scaleEnemyValue } from "../game/Difficulty";
import { attackProfile, MONSTER_HIT_THRESHOLD } from "../game/MeleeRules";
import { MONSTER_DEFINITIONS, type MonsterKind } from "./Monster";

const CHAMPION_HEALTH_PER_FLOOR = 6;

// Only the optional champion grows with depth. Catalog values describe floor 8.
const championDepth = (kind: MonsterKind, floorNumber: number): number =>
	kind === "iron-champion"
		? Math.max(
				0,
				Math.min(MONSTER_DEFINITIONS[kind].maxFloor, floorNumber) -
					MONSTER_DEFINITIONS[kind].minFloor,
			)
		: 0;
export const monsterAttackDamage = (
	kind: MonsterKind,
	floorNumber = MONSTER_DEFINITIONS[kind].minFloor,
): number =>
	MONSTER_DEFINITIONS[kind].attackDamage + championDepth(kind, floorNumber);

export const maximumMonsterHealth = (
	kind: MonsterKind,
	difficulty: Difficulty = 1,
	floorNumber = MONSTER_DEFINITIONS[kind].minFloor,
): number =>
	scaleEnemyValue(
		MONSTER_DEFINITIONS[kind].maxHealth +
			CHAMPION_HEALTH_PER_FLOOR * championDepth(kind, floorNumber),
		difficulty,
	);
export const monsterDamageRange = (
	kind: MonsterKind,
	difficulty: Difficulty = 1,
	floorNumber = MONSTER_DEFINITIONS[kind].minFloor,
) => {
	const raw = attackProfile(
		monsterAttackDamage(kind, floorNumber),
		MONSTER_HIT_THRESHOLD,
	);
	return {
		minDamage: scaleEnemyValue(raw.minDamage, difficulty),
		maxDamage: scaleEnemyValue(raw.maxDamage, difficulty),
	};
};
