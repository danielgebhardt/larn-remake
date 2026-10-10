import type { PlayerStats } from "../game/PlayerStats";
import { type Bag, createBag } from "./Bag";
import { ITEM_DEFINITIONS, type ItemKind } from "./Item";

export type ConsumeAction = { type: "consume"; itemId: string };
export type ConsumptionEvent = {
	type: "item-consumed";
	item: ItemKind;
	recovered: number;
};

export const consumeItem = (
	player: PlayerStats,
	bag: Bag,
	action: ConsumeAction,
):
	| { player: PlayerStats; bag: Bag; event: ConsumptionEvent }
	| { error: string } => {
	const selected = bag.items.find((item) => item.id === action.itemId);
	if (!selected) return { error: "That item is no longer in your bag." };
	const definition = ITEM_DEFINITIONS[selected.kind];
	if (definition.type !== "potion")
		return { error: "That item cannot be consumed." };
	if (player.health <= 0)
		return { error: "You cannot drink a potion after death." };
	if (player.health >= player.maxHealth)
		return { error: "You are already at full health." };
	const recovered = Math.min(
		definition.healing,
		player.maxHealth - player.health,
	);
	return {
		player: { ...player, health: player.health + recovered },
		bag: createBag(bag.items.filter((item) => item.id !== selected.id)),
		event: { type: "item-consumed", item: selected.kind, recovered },
	};
};
