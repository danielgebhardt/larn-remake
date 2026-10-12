import { updateExploration } from "../domain/dungeon/Exploration";
import { DEFAULT_FOG_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import type { GameState } from "../domain/game/GameState";
import {
	type PlayerAction,
	resolvePlayerAction,
} from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import { createSaveDocument } from "../domain/saves/SaveFormat";
import { bruteEncounter } from "./BruteTestHelpers";
import { COMPACT_TEST_CONFIGURATION } from "./TestRunConfiguration";

// One open floor makes the response turn and archer's clear shot explicit.
// All five linked floors and the cure remain valid for the real save boundary.
export const mixedEncounter = (): GameState => {
	const state = bruteEncounter();
	return {
		...state,
		bag: createBag([
			{ id: "review:health", kind: "healing-potion" },
			{ id: "review:mana", kind: "mana-potion" },
		]),
		monsters: [
			...state.monsters,
			{
				id: "4:2",
				kind: "goblin-archer",
				floorNumber: 4,
				coordinate: { row: 4, col: 8 },
				health: 5,
				intent: { type: "idle" },
			},
			{
				id: "4:3",
				kind: "goblin",
				floorNumber: 4,
				coordinate: { row: 5, col: 4 },
				health: 1,
				intent: { type: "idle" },
			},
		],
	};
};
export const tacticalSnapshot = (state: GameState) =>
	createSaveDocument(
		state,
		updateExploration(state.run, DEFAULT_FOG_CONFIGURATION.radius),
		COMPACT_TEST_CONFIGURATION,
		DEFAULT_FOG_CONFIGURATION,
		new Date("2026-10-11T12:00:00Z"),
	);
export const preparedMixedEncounter = () =>
	resolvePlayerAction(mixedEncounter(), { type: "wait" }).state;

// Dodge, remove the nearby goblin, finish the archer, recover, and dodge again.
// Invalid pickup is intentionally free and cannot perturb subsequent rolls.
export const mixedFollowUp: readonly PlayerAction[] = [
	{ type: "pickup", itemId: "missing" },
	{ type: "move", direction: "left" },
	{ type: "cast", spell: "magic-missile", targetId: "4:3" },
	{ type: "cast", spell: "magic-missile", targetId: "4:2" },
	{ type: "move", direction: "up" },
	{ type: "cast", spell: "magic-missile", targetId: "4:2" },
	{ type: "consume", itemId: "review:health" },
	{ type: "move", direction: "left" },
	{ type: "consume", itemId: "review:mana" },
];
export const afterMixedEncounter = () =>
	mixedFollowUp.reduce(
		(state, action) => resolvePlayerAction(state, action).state,
		preparedMixedEncounter(),
	);
