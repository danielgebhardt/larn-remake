import { appendActivityEvents } from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { orthogonalDistance } from "../monsters/MonsterLocations";
import { drawFountain } from "./DungeonFountains";
import { disarmTrap } from "./DungeonTraps";
import { openChest } from "./TreasureChests";
export type ObjectChoice = "sip" | "draw";
export type InteractAction = {
	type: "interact";
	objectId?: string;
	choice?: ObjectChoice;
};
export const nearbyInteractionObject = (
	state: GameState,
	objectId?: string,
) => {
	const nearby = state.objects.filter(
		(object) =>
			object.floorNumber === state.run.activeFloor &&
			orthogonalDistance(object.coordinate, state.run.playerCoordinate) <= 1 &&
			object.kind !== "gold" &&
			(object.kind === "door" || !object.activated),
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
	const object = objectId
		? nearby.find((object) => object.id === objectId)
		: [...nearby].sort((a, b) => order(a.coordinate) - order(b.coordinate))[0];
	return object;
};
export const interactObject = (
	state: GameState,
	action: InteractAction,
): GameState | { error: string } => {
	const object = nearbyInteractionObject(state, action.objectId);
	const player = state.run.playerCoordinate;
	if (!object) return { error: "No object within reach." };
	if (object.kind === "fountain")
		return drawFountain(state, object, action.choice);
	if (object.kind === "trap") return disarmTrap(state, object);
	if (object.kind === "chest") return openChest(state, object);

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
