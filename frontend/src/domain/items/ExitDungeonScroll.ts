import type { Coordinate } from "../dungeon/DungeonTypes";
import { FLOOR } from "../dungeon/Tiles";
import { appendActivityEvents } from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { navigationRun } from "../objects/NavigationTerrain";
import { removeBagItem } from "./Bag";

export type ExitDungeonAction = { type: "exit-dungeon"; itemId: string };
export const EXIT_SCROLL_EMBER_RESTRICTION =
	"Exit scrolls cannot be used while carrying the Last Ember.";
const same = (a: Coordinate, b: Coordinate) =>
	a.row === b.row && a.col === b.col;
// Stable compass order, not a new random roll. Inspect only four neighbors;
// never overwrite existing content or silently choose a more distant arrival.
export const exitScrollArrival = (state: GameState): Coordinate | undefined => {
	const floor = navigationRun(state).floors[0];
	if (!floor) return;
	const entrance = state.quest.entrance;
	const candidates = [
		{ row: entrance.row - 1, col: entrance.col },
		{ row: entrance.row, col: entrance.col + 1 },
		{ row: entrance.row + 1, col: entrance.col },
		{ row: entrance.row, col: entrance.col - 1 },
	];
	return candidates.find(
		(point) =>
			floor.terrain[point.row]?.[point.col] === FLOOR &&
			![floor.upStair?.coordinate, floor.downStair?.coordinate].some(
				(stair) => stair && same(stair, point),
			) &&
			!state.objects.some(
				(x) => x.floorNumber === 1 && same(x.coordinate, point),
			) &&
			!state.floorItems.some(
				(x) => x.floorNumber === 1 && same(x.coordinate, point),
			) &&
			!state.monsters.some(
				(x) => x.floorNumber === 1 && x.health > 0 && same(x.coordinate, point),
			),
	);
};
export const readExitScroll = (
	state: GameState,
	action: ExitDungeonAction,
): GameState | { error: string } => {
	if (state.player.health <= 0 || state.quest.victory)
		return { error: "The adventure has ended." };
	const scroll = state.bag.items.find((x) => x.id === action.itemId);
	if (scroll?.kind !== "exit-scroll")
		return { error: "Choose an exit scroll in your bag." };
	if (state.quest.cureRecovered)
		return { error: EXIT_SCROLL_EMBER_RESTRICTION };
	const { row, col } = state.run.playerCoordinate;
	const entrance = state.quest.entrance;
	if (
		state.run.activeFloor === 1 &&
		Math.abs(row - entrance.row) + Math.abs(col - entrance.col) === 1
	)
		return { error: "You are already beside the dungeon entrance." };
	const arrival = exitScrollArrival(state);
	if (!arrival)
		return {
			error:
				"There is no safe tile beside the dungeon entrance. The scroll remains unread.",
		};
	return {
		...state,
		run: { ...state.run, activeFloor: 1, playerCoordinate: arrival },
		bag: removeBagItem(state.bag, scroll.id),
		activityHistory: appendActivityEvents(state.activityHistory, [
			{
				type: "exit-scroll-used",
				fromFloor: state.run.activeFloor,
				turn: state.turn,
			},
		]),
	};
};
