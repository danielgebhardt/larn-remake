import type { DamageElement } from "../game/DamageElements";
import { MONSTER_DEFINITIONS, type MonsterKind } from "./Monster";
export const resistedDamage = (
	kind: MonsterKind,
	incoming: number,
	element: DamageElement,
): number => {
	if (!Number.isSafeInteger(incoming) || incoming < 0)
		throw new RangeError("Damage must be a nonnegative whole number.");
	if (incoming === 0) return 0;
	const definition = MONSTER_DEFINITIONS[kind];
	if (definition.resists?.includes(element))
		return Math.max(1, Math.floor(incoming / 2));
	if (definition.weaknesses?.includes(element)) return incoming * 2;
	return incoming;
};
