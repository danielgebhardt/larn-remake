import { appendActivityEvents } from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { orthogonalDistance } from "../monsters/MonsterLocations";
import { collectGoldAtPlayer } from "./Gold";
import { openChest } from "./TreasureChests";
export type InteractAction = { type: "interact"; objectId?: string };
export const interactObject = (
	state: GameState,
	action: InteractAction,
): GameState | { error: string } => {
	const nearby = state.objects.filter(
		(object) =>
			object.floorNumber === state.run.activeFloor &&
			orthogonalDistance(object.coordinate, state.run.playerCoordinate) <= 1 &&
			!(object.kind === "gold" && object.activated),
	);
	const player = state.run.playerCoordinate;
	const order = (coordinate: { row: number; col: number }) =>
		coordinate.row === player.row && coordinate.col === player.col
			? 0
			: coordinate.row < player.row
				? 1
				: coordinate.col > player.col
					? 2
					: coordinate.row > player.row
						? 3
						: 4;
	const object = action.objectId
		? nearby.find((object) => object.id === action.objectId)
		: [...nearby].sort((a, b) => order(a.coordinate) - order(b.coordinate))[0];
	if (!object) return { error: "No object within reach." };
	if (object.kind === "chest") return openChest(state, object);
	if (object.kind === "gold")
		return orthogonalDistance(object.coordinate, player) === 0 &&
			!object.activated
			? collectGoldAtPlayer(state)
			: { error: "Walk onto the coins to collect them." };
	if (
		object.activated &&
		(orthogonalDistance(object.coordinate, player) === 0 ||
			state.monsters.some(
				(actor) =>
					actor.health > 0 &&
					actor.floorNumber === object.floorNumber &&
					orthogonalDistance(actor.coordinate, object.coordinate) === 0,
			))
	)
		return { error: "An occupied door cannot be closed." };
	return {
		...state,
		objects: state.objects.map((entry) =>
			entry.id === object.id
				? { ...entry, activated: !entry.activated }
				: entry,
		),
		activityHistory: appendActivityEvents(state.activityHistory, [
			{ type: "door-changed", opened: !object.activated, turn: state.turn },
		]),
	};
};
