import type { Coordinate } from "../dungeon/DungeonTypes.ts";

export type MonsterKind = "goblin";

export type Monster = {
	id: string;
	kind: MonsterKind;
	floorNumber: number;
	coordinate: Coordinate;
	health: number;
};

export const MONSTER_DEFINITIONS: Record<
	MonsterKind,
	{ maxHealth: number; attackDamage: number }
> = {
	goblin: { maxHealth: 4, attackDamage: 1 },
};
