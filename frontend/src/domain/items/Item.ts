export type ItemDefinition = {
	name: string;
	type: "potion" | "weapon" | "shield" | "chest-armor" | "helmet";
	attackBonus: number;
	armor: number;
	description: string;
	minFloor: number;
	maxFloor: number;
	foundWeight: number;
	dropWeight: number;
};
export const ITEM_DEFINITIONS = {
	"healing-potion": {
		minFloor: 1,
		maxFloor: 20,
		foundWeight: 5,
		dropWeight: 5,
		name: "Healing potion",
		type: "potion",
		attackBonus: 0,
		armor: 0,
		healing: 5,
		description:
			"Restores up to 5 health when consumed. Drinking uses one turn.",
	},
	"iron-sword": {
		minFloor: 2,
		maxFloor: 20,
		foundWeight: 2,
		dropWeight: 2,
		name: "Iron sword",
		type: "weapon",
		attackBonus: 2,
		armor: 0,
		description:
			"A heavier blade with a stronger edge than your starting sword.",
	},
	"short-sword": {
		minFloor: 1,
		maxFloor: 20,
		foundWeight: 2,
		dropWeight: 3,
		name: "Short sword",
		type: "weapon",
		attackBonus: 1,
		armor: 0,
		description: "A simple, dependable blade for exploring the dungeon.",
	},
	"wooden-shield": {
		minFloor: 1,
		maxFloor: 20,
		foundWeight: 2,
		dropWeight: 3,
		name: "Wooden shield",
		type: "shield",
		attackBonus: 0,
		armor: 1,
		description: "A small wooden shield carried in your off hand.",
	},

	"leather-armor": {
		name: "Leather armor",
		type: "chest-armor",
		attackBonus: 0,
		armor: 1,
		description: "Light chest protection. Reduces landed incoming damage by 1.",
		minFloor: 1,
		maxFloor: 20,
		foundWeight: 3,
		dropWeight: 2,
	},
	"chain-armor": {
		name: "Chain armor",
		type: "chest-armor",
		attackBonus: 0,
		armor: 2,
		description:
			"Linked metal rings protect your chest. Reduces landed incoming damage by 2.",
		minFloor: 3,
		maxFloor: 20,
		foundWeight: 2,
		dropWeight: 1,
	},
	"leather-cap": {
		name: "Leather cap",
		type: "helmet",
		attackBonus: 0,
		armor: 1,
		description:
			"A padded cap for your head. Reduces landed incoming damage by 1.",
		minFloor: 1,
		maxFloor: 20,
		foundWeight: 2,
		dropWeight: 2,
	},
	"iron-helmet": {
		name: "Iron helmet",
		type: "helmet",
		attackBonus: 0,
		armor: 2,
		description: "A sturdy helmet. Reduces landed incoming damage by 2.",
		minFloor: 3,
		maxFloor: 20,
		foundWeight: 1,
		dropWeight: 1,
	},
} as const;

export type ItemKind = keyof typeof ITEM_DEFINITIONS;

// Kind identifies the shared definition; id identifies this particular copy.
export type ItemInstance = Readonly<{ id: string; kind: ItemKind }>;

export type LootSource = "found" | "drop";
export const validateItemDefinition = (definition: ItemDefinition): void => {
	const { minFloor, maxFloor, foundWeight, dropWeight, armor, attackBonus } =
		definition;
	if (
		!Number.isInteger(minFloor) ||
		!Number.isInteger(maxFloor) ||
		minFloor < 1 ||
		maxFloor > 20 ||
		minFloor > maxFloor ||
		![foundWeight, dropWeight].every(
			(weight) => Number.isFinite(weight) && weight >= 0,
		) ||
		foundWeight + dropWeight === 0 ||
		!Number.isInteger(armor) ||
		armor < 0 ||
		!Number.isInteger(attackBonus) ||
		attackBonus < 0
	)
		throw new RangeError("Invalid item floor range, weights, or bonuses.");
};
for (const definition of Object.values(ITEM_DEFINITIONS))
	validateItemDefinition(definition);
export const eligibleLootKinds = (
	floor: number,
	source: LootSource,
): ItemKind[] =>
	(Object.keys(ITEM_DEFINITIONS) as ItemKind[]).filter((kind) => {
		const definition = ITEM_DEFINITIONS[kind];
		return (
			floor >= definition.minFloor &&
			floor <= definition.maxFloor &&
			definition[source === "found" ? "foundWeight" : "dropWeight"] > 0
		);
	});
