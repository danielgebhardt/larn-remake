import type { ItemKind } from "./Item";

export const LOOT_KINDS: readonly ItemKind[] = [
	"short-sword",
	"iron-sword",
	"wooden-shield",
	"healing-potion",
];
export const selectLootKind = (random: () => number): ItemKind =>
	LOOT_KINDS[Math.floor(random() * LOOT_KINDS.length)];
