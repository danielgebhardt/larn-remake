import { selectWeighted } from "../content/WeightedSelection";
import type { Coordinate } from "../dungeon/DungeonTypes.ts";
import { MAX_FLOORS } from "../dungeon/RunConfiguration";
import type { ItemKind } from "../items/Item";

export type MonsterKind = "goblin" | "giant-rat" | "orc";

export type Monster = {
	// Stable identity: floorNumber:spawnIndex (index starts at 1).
	id: string;
	kind: MonsterKind;
	floorNumber: number;
	coordinate: Coordinate;
	health: number;
};

export type MonsterDefinition = {
	name: string;
	maxHealth: number;
	attackDamage: number;
	detectionRadius: number;
	minFloor: number;
	maxFloor: number;
	spawnWeight: number;
	dropChance: number;
	lootPreferences: Partial<Record<ItemKind, number>>;
};
export const validateMonsterDefinition = (
	definition: MonsterDefinition,
): void => {
	const {
		dropChance,
		lootPreferences,
		minFloor,
		maxFloor,
		spawnWeight,
		maxHealth,
		attackDamage,
		detectionRadius,
	} = definition;
	if (
		!Number.isFinite(dropChance) ||
		dropChance < 0 ||
		dropChance > 1 ||
		Object.values(lootPreferences).some(
			(weight) => !Number.isFinite(weight) || weight < 0,
		) ||
		!Number.isInteger(minFloor) ||
		!Number.isInteger(maxFloor) ||
		minFloor < 1 ||
		maxFloor > MAX_FLOORS ||
		minFloor > maxFloor ||
		!Number.isFinite(spawnWeight) ||
		spawnWeight <= 0 ||
		!Number.isInteger(maxHealth) ||
		maxHealth < 1 ||
		!Number.isInteger(attackDamage) ||
		attackDamage < 1 ||
		!Number.isInteger(detectionRadius) ||
		detectionRadius < 0
	)
		throw new RangeError(
			"Invalid monster stats, floor range, or spawn weight.",
		);
};
export const MONSTER_DEFINITIONS: Record<MonsterKind, MonsterDefinition> = {
	goblin: {
		name: "goblin",
		maxHealth: 4,
		attackDamage: 1,
		detectionRadius: 6,
		minFloor: 1,
		maxFloor: MAX_FLOORS,
		spawnWeight: 3,
		dropChance: 0.5,
		lootPreferences: { "short-sword": 2, "wooden-shield": 2 },
	},
	"giant-rat": {
		name: "giant rat",
		maxHealth: 2,
		attackDamage: 1,
		detectionRadius: 5,
		minFloor: 1,
		maxFloor: 4,
		spawnWeight: 2,
		dropChance: 0.35,
		lootPreferences: {},
	},
	orc: {
		name: "orc",
		maxHealth: 7,
		attackDamage: 4,
		detectionRadius: 6,
		minFloor: 3,
		maxFloor: MAX_FLOORS,
		spawnWeight: 2,
		dropChance: 0.7,
		lootPreferences: { "chain-armor": 2, "iron-helmet": 2 },
	},
};
for (const definition of Object.values(MONSTER_DEFINITIONS))
	validateMonsterDefinition(definition);
export const eligibleMonsterKinds = (floor: number): MonsterKind[] =>
	(Object.keys(MONSTER_DEFINITIONS) as MonsterKind[]).filter((kind) => {
		const definition = MONSTER_DEFINITIONS[kind];
		return floor >= definition.minFloor && floor <= definition.maxFloor;
	});

export const selectMonsterKind = (
	floor: number,
	random: () => number,
): MonsterKind | undefined =>
	selectWeighted(
		eligibleMonsterKinds(floor).map((kind) => ({
			value: kind,
			weight: MONSTER_DEFINITIONS[kind].spawnWeight,
		})),
		random,
	);
