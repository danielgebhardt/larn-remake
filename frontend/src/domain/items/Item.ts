import { MAX_FLOORS } from "../dungeon/RunConfiguration";
export type ItemDefinition = {
	name: string;
	type:
		| "potion"
		| "weapon"
		| "shield"
		| "chest-armor"
		| "helmet"
		| "quest"
		| "spellbook"
		| "ring";
	attackBonus: number;
	armor: number;
	stats?: Partial<
		Record<
			"strength" | "dexterity" | "intelligence" | "health" | "mana",
			number
		>
	>;
	description: string;
	minFloor: number;
	maxFloor: number;
	foundWeight: number;
	dropWeight: number;
};
export const ITEM_DEFINITIONS = {
	"copper-ring": {
		name: "Copper ring",
		type: "ring",
		attackBonus: 0,
		armor: 1,
		description:
			"A warded copper band. Adds 1 armor while worn in either ring slot.",
		minFloor: 2,
		maxFloor: 8,
		foundWeight: 1,
		dropWeight: 1,
	},
	"ring-strength": {
		name: "Ring of Strength",
		type: "ring",
		attackBonus: 0,
		armor: 0,
		stats: { strength: 2 },
		description:
			"Adds 2 strength while equipped in either ring slot. Capacity increases do not refill resources.",
		minFloor: 4,
		maxFloor: 15,
		foundWeight: 1,
		dropWeight: 1,
	},
	"ring-dexterity": {
		name: "Ring of Dexterity",
		type: "ring",
		attackBonus: 0,
		armor: 0,
		stats: { dexterity: 2 },
		description:
			"Adds 2 dexterity while equipped in either ring slot. Capacity increases do not refill resources.",
		minFloor: 4,
		maxFloor: 15,
		foundWeight: 1,
		dropWeight: 1,
	},
	"ring-intelligence": {
		name: "Ring of Intelligence",
		type: "ring",
		attackBonus: 0,
		armor: 0,
		stats: { intelligence: 2 },
		description:
			"Adds 2 intelligence while equipped in either ring slot. Capacity increases do not refill resources.",
		minFloor: 6,
		maxFloor: 20,
		foundWeight: 1,
		dropWeight: 1,
	},
	"ring-vitality": {
		name: "Ring of Vitality",
		type: "ring",
		attackBonus: 0,
		armor: 0,
		stats: { health: 4 },
		description:
			"Adds 4 health while equipped in either ring slot. Capacity increases do not refill resources.",
		minFloor: 5,
		maxFloor: 20,
		foundWeight: 1,
		dropWeight: 1,
	},
	"ring-mana": {
		name: "Ring of Mana",
		type: "ring",
		attackBonus: 0,
		armor: 0,
		stats: { mana: 4 },
		description:
			"Adds 4 mana while equipped in either ring slot. Capacity increases do not refill resources.",
		minFloor: 5,
		maxFloor: 20,
		foundWeight: 1,
		dropWeight: 1,
	},
	cure: {
		name: "Cure",
		type: "quest",
		attackBonus: 0,
		armor: 0,
		description:
			"The cure you came to recover. Carry it safely back to the entrance.",
		minFloor: 1,
		maxFloor: MAX_FLOORS,
		foundWeight: 0,
		dropWeight: 0,
	},
	"healing-potion": {
		minFloor: 1,
		maxFloor: MAX_FLOORS,
		foundWeight: 5,
		dropWeight: 5,
		name: "Healing potion",
		type: "potion",
		attackBonus: 0,
		armor: 0,
		recovery: { resource: "health", amount: 5 },
		description:
			"Restores up to 5 health when consumed. Drinking uses one turn.",
	},
	"steel-sword": {
		name: "Steel sword",
		type: "weapon",
		attackBonus: 3,
		armor: 0,
		description:
			"A tempered blade for the middle dungeon. Adds 3 melee attack.",
		minFloor: 4,
		maxFloor: 10,
		foundWeight: 1,
		dropWeight: 1,
	},
	"battle-axe": {
		name: "Battle axe",
		type: "weapon",
		attackBonus: 4,
		armor: 0,
		description: "A heavy axe that rewards close combat. Adds 4 melee attack.",
		minFloor: 8,
		maxFloor: 15,
		foundWeight: 1,
		dropWeight: 1,
	},
	runeblade: {
		name: "Runeblade",
		type: "weapon",
		attackBonus: 6,
		armor: 0,
		description:
			"An ancient blade with a strong enchanted edge. Adds 6 melee attack.",
		minFloor: 12,
		maxFloor: 20,
		foundWeight: 1,
		dropWeight: 1,
	},
	"star-forged-blade": {
		name: "Star-forged blade",
		type: "weapon",
		attackBonus: 8,
		armor: 0,
		description:
			"A rare blade made for the deepest encounters. Adds 8 melee attack.",
		minFloor: 16,
		maxFloor: 20,
		foundWeight: 1,
		dropWeight: 1,
	},
	"iron-sword": {
		minFloor: 2,
		maxFloor: MAX_FLOORS,
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
		maxFloor: MAX_FLOORS,
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
		maxFloor: MAX_FLOORS,
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
		maxFloor: MAX_FLOORS,
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
		maxFloor: MAX_FLOORS,
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
		maxFloor: MAX_FLOORS,
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
		maxFloor: MAX_FLOORS,
		foundWeight: 1,
		dropWeight: 1,
	},
	"book-ember-bolt": {
		name: "Spellbook: Ember Bolt",
		type: "spellbook",
		teaches: "ember-bolt",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Ember Bolt: 4 mana, range 4, 3–7 damage plus Intelligence. Reading uses one turn and no bag slot.",
		minFloor: 1,
		maxFloor: 5,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-frost-bolt": {
		name: "Spellbook: Frost Bolt",
		type: "spellbook",
		teaches: "frost-bolt",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Frost Bolt: 4 mana, range 5, 2–4 damage plus Intelligence and a three-phase slow. Reading uses one turn and no bag slot.",
		minFloor: 2,
		maxFloor: 8,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-shock": {
		name: "Spellbook: Shock",
		type: "spellbook",
		teaches: "shock",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Shock: 5 mana, range 5, 5–8 damage plus Intelligence. A focused jolt with stronger damage than Magic Missile at a higher mana cost. Reading uses one turn and no bag slot.",
		minFloor: 3,
		maxFloor: 9,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-stone-lance": {
		name: "Spellbook: Stone Lance",
		type: "spellbook",
		teaches: "stone-lance",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Stone Lance: 6 mana, range 7, 6–10 damage plus Intelligence. A heavy stone projectile with a longer reach and substantial mana cost. Reading uses one turn and no bag slot.",
		minFloor: 5,
		maxFloor: 12,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-sonic-spear": {
		name: "Spellbook: Sonic Spear",
		type: "spellbook",
		teaches: "sonic-spear",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Sonic Spear: 8 mana, range 8, 8–13 damage plus Intelligence. A powerful long-range strike for the deeper dungeon. Reading uses one turn and no bag slot.",
		minFloor: 10,
		maxFloor: 20,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-drain-life": {
		name: "Spellbook: Drain Life",
		type: "spellbook",
		teaches: "drain-life",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Drain Life: 6 mana, range 2, 4–8 damage plus Intelligence. A close-range attack that restores health equal to actual damage dealt, up to your missing health. Reading uses one turn and no bag slot.",
		minFloor: 7,
		maxFloor: 15,
		foundWeight: 0,
		dropWeight: 0,
	},

	"book-web": {
		name: "Spellbook: Web",
		type: "spellbook",
		teaches: "web",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Web: 3 mana, range 4. Web one monster for three active phases. It cannot move, but can still attack if in range. Reading uses one turn and no bag slot.",
		minFloor: 2,
		maxFloor: 9,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-sleep": {
		name: "Spellbook: Sleep",
		type: "spellbook",
		teaches: "sleep",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Sleep: 5 mana, range 4. Put one monster to sleep for three active phases. Any damage wakes it before its response. Cancels prepared attacks. Reading uses one turn and no bag slot.",
		minFloor: 3,
		maxFloor: 11,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-fear": {
		name: "Spellbook: Fear",
		type: "spellbook",
		teaches: "fear",
		attackBonus: 0,
		armor: 0,
		description:
			"Pick up to learn Fear: 4 mana, range 5. Force one monster to retreat for three active phases instead of attacking. Cancels prepared attacks; blocked escape still consumes its action. Reading uses one turn and no bag slot.",
		minFloor: 4,
		maxFloor: 14,
		foundWeight: 0,
		dropWeight: 0,
	},

	"book-poison-dart": {
		name: "Spellbook: Poison Dart",
		type: "spellbook",
		teaches: "poison-dart",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Poison Dart: 4 mana, range 5, 1–2 initial damage plus Intelligence, then 2 poison damage for three active phases. Reading uses one turn and no bag slot.",
		minFloor: 4,
		maxFloor: 13,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-renewal": {
		name: "Spellbook: Renewal",
		type: "spellbook",
		teaches: "renewal",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Renewal: 5 mana, restores 2 health after retaliation for four turns. A fatal hit still kills you. Reading uses one turn and no bag slot.",
		minFloor: 3,
		maxFloor: 12,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-protection": {
		name: "Spellbook: Protection",
		type: "spellbook",
		teaches: "protection",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Protection: 3 mana. Gain 2 armor for six committed turns, including this turn. Reading uses one turn and no bag slot.",
		minFloor: 3,
		maxFloor: 12,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-strength": {
		name: "Spellbook: Strength",
		type: "spellbook",
		teaches: "strength",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Strength: 4 mana. Gain 2 Strength for six committed turns, improving melee damage. Reading uses one turn and no bag slot.",
		minFloor: 5,
		maxFloor: 15,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-dexterity": {
		name: "Spellbook: Dexterity",
		type: "spellbook",
		teaches: "dexterity",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Dexterity: 4 mana. Gain 2 Dexterity for six committed turns, improving hit and evasion chances. Reading uses one turn and no bag slot.",
		minFloor: 5,
		maxFloor: 15,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-blink": {
		name: "Spellbook: Blink",
		type: "spellbook",
		teaches: "blink",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Blink: 4 mana. Move to a safe nearby tile within three steps. Reading uses one turn and no bag slot.",
		minFloor: 4,
		maxFloor: 14,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-teleport-away": {
		name: "Spellbook: Teleport Away",
		type: "spellbook",
		teaches: "teleport-away",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Teleport Away: 6 mana. Move one monster farther away on this floor, range 5. Reading uses one turn and no bag slot.",
		minFloor: 6,
		maxFloor: 18,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-fireball": {
		name: "Spellbook: Fireball",
		type: "spellbook",
		teaches: "fireball",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Fireball: 8 mana. Range 6, radius 1, damage 6–10 plus Intelligence. Enemies only; walls block the blast. Reading uses one turn and no bag slot.",
		minFloor: 9,
		maxFloor: 20,
		foundWeight: 0,
		dropWeight: 0,
	},
	"book-frost-nova": {
		name: "Spellbook: Frost Nova",
		type: "spellbook",
		teaches: "frost-nova",
		attackBonus: 0,
		armor: 0,
		description:
			"Learn Frost Nova: 8 mana. Self-centered radius 2, damage 3–5 plus Intelligence and three-phase slow. Walls block the blast. Reading uses one turn and no bag slot.",
		minFloor: 8,
		maxFloor: 20,
		foundWeight: 0,
		dropWeight: 0,
	},
	"mana-potion": {
		name: "Mana potion",
		type: "potion",
		attackBonus: 0,
		armor: 0,
		recovery: { resource: "mana", amount: 5 },
		description: "Restores up to 5 mana when consumed. Drinking uses one turn.",
		minFloor: 1,
		maxFloor: MAX_FLOORS,
		foundWeight: 5,
		dropWeight: 5,
	},
} as const;

export type ItemKind = keyof typeof ITEM_DEFINITIONS;

// Kind identifies the shared definition; id identifies this particular copy.
export type ItemInstance = Readonly<{ id: string; kind: ItemKind }>;

export type LootSource = "found" | "drop";
export const validateItemDefinition = (definition: ItemDefinition): void => {
	const stats = definition.stats ?? {};
	if (
		!Object.values(stats).every(
			(value) => Number.isSafeInteger(value) && value >= 0,
		)
	)
		throw new RangeError("Invalid equipment stat bonus.");
	const { minFloor, maxFloor, foundWeight, dropWeight, armor, attackBonus } =
		definition;
	if (
		!Number.isInteger(minFloor) ||
		!Number.isInteger(maxFloor) ||
		minFloor < 1 ||
		maxFloor > MAX_FLOORS ||
		minFloor > maxFloor ||
		![foundWeight, dropWeight].every(
			(weight) => Number.isFinite(weight) && weight >= 0,
		) ||
		(!["quest", "spellbook"].includes(definition.type) &&
			foundWeight + dropWeight === 0) ||
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
