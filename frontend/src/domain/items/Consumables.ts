import type { GameState } from "../game/GameState";
import { maximumMana } from "../game/Mana";
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
	state: Pick<
		GameState,
		"player" | "mana" | "progression" | "bag" | "equipment"
	>,
	action: ConsumeAction,
):
	| { player: PlayerStats; mana: number; bag: Bag; event: ConsumptionEvent }
	| { error: string } => {
	const { player, bag, mana } = state;
	const selected = bag.items.find((item) => item.id === action.itemId);
	if (!selected) return { error: "That item is no longer in your bag." };
	const definition = ITEM_DEFINITIONS[selected.kind];
	if (definition.type !== "potion")
		return { error: "That item cannot be consumed." };
	if (player.health <= 0)
		return { error: "You cannot drink a potion after death." };
	const { resource, amount } = definition.recovery;
	const current = resource === "health" ? player.health : mana;
	const maximum =
		resource === "health"
			? player.maxHealth
			: maximumMana(state.progression, state.equipment);
	if (current >= maximum)
		return { error: `You are already at full ${resource}.` };
	const recovered = Math.min(amount, maximum - current);

	return {
		player:
			resource === "health"
				? { ...player, health: player.health + recovered }
				: player,
		mana: resource === "mana" ? mana + recovered : mana,
		bag: createBag(bag.items.filter((item) => item.id !== selected.id)),
		event: { type: "item-consumed", item: selected.kind, recovered },
	};
};
