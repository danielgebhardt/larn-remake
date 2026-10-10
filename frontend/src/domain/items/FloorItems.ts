import type { Coordinate } from "../dungeon/DungeonTypes";
import type { GameState } from "../game/GameState";
import { BAG_CAPACITY, type Bag, createBag } from "./Bag";
import type { ItemInstance, ItemKind } from "./Item";

export type FloorItem = Readonly<{
	item: ItemInstance;
	floorNumber: number;
	coordinate: Coordinate;
}>;
export type FloorItemAction =
	| { type: "pickup"; itemId: string }
	| { type: "drop"; itemId: string };
export type FloorItemEvent = {
	type: "item-picked-up" | "item-dropped";
	item: ItemKind;
};
type Transfer =
	| { bag: Bag; floorItems: readonly FloorItem[]; event: FloorItemEvent }
	| { error: string };

export const itemsAtPlayer = (
	state: Pick<GameState, "run" | "floorItems">,
): readonly FloorItem[] =>
	state.floorItems.filter(
		({ floorNumber, coordinate }) =>
			floorNumber === state.run.activeFloor &&
			coordinate.row === state.run.playerCoordinate.row &&
			coordinate.col === state.run.playerCoordinate.col,
	);

export const transferFloorItem = (
	state: GameState,
	action: FloorItemAction,
): Transfer => {
	if (action.type === "pickup") {
		const found = itemsAtPlayer(state).find(
			(entry) => entry.item.id === action.itemId,
		);
		if (!found) return { error: "That item is not on your current tile." };
		if (state.bag.items.length >= BAG_CAPACITY)
			return {
				error: "Your bag is full. Make room before picking up an item.",
			};
		if (
			[
				...state.bag.items,
				state.equipment.mainHand,
				state.equipment.offHand,
			].some((item) => item?.id === action.itemId)
		)
			return { error: "You already own that item." };
		return {
			bag: createBag([...state.bag.items, found.item]),
			floorItems: state.floorItems.filter((entry) => entry !== found),
			event: { type: "item-picked-up", item: found.item.kind },
		};
	}
	const item = state.bag.items.find((item) => item.id === action.itemId);
	if (!item)
		return {
			error:
				"That item is not in your bag. Unequip worn gear before dropping it.",
		};
	if (state.floorItems.some((entry) => entry.item.id === item.id))
		return { error: "That item is already on the floor." };
	return {
		bag: createBag(state.bag.items.filter((entry) => entry.id !== item.id)),
		floorItems: [
			...state.floorItems,
			{
				item,
				floorNumber: state.run.activeFloor,
				coordinate: { ...state.run.playerCoordinate },
			},
		],
		event: { type: "item-dropped", item: item.kind },
	};
};
