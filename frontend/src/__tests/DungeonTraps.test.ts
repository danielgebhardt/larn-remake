// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import { savedAdventure } from "./SaveTestHelpers";

const trap = {
	id: "floor:1:object:trap:1",
	kind: "trap" as const,
	floorNumber: 1,
	coordinate: { row: 1, col: 2 },
	activated: false,
};
const encounter = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	objects: [trap],
});
it("a visible trap hurts once on entry within the movement turn and stays spent on revisits", () => {
	const initial = encounter();
	const sprung = resolvePlayerAction(initial, {
		type: "move",
		direction: "right",
	}).state;
	expect(sprung.turn).toBe(1);
	expect(sprung.player.health).toBeLessThan(10);
	expect(sprung.player.health).toBeGreaterThanOrEqual(6);
	expect(sprung.objects[0].activated).toBe(true);
	const back = resolvePlayerAction(sprung, {
		type: "move",
		direction: "left",
	}).state;
	expect(
		resolvePlayerAction(back, { type: "move", direction: "right" }).state.player
			.health,
	).toBe(sprung.player.health);
});
it("disarm uses Dexterity and one fixed identity roll; a spent trap cannot be farmed", () => {
	for (let seed = 0; seed < 12; seed++) {
		const state = { ...encounter(), run: { ...encounter().run, seed } };
		const result = resolvePlayerAction(state, { type: "interact" });
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.objects[0].activated).toBe(true);
		expect(resolvePlayerAction(state, { type: "interact" }).state).toEqual(
			result.state,
		);
		expect(
			resolvePlayerAction(result.state, { type: "interact" }).turnAdvanced,
		).toBe(false);
	}
});
it("fatal trap damage ends the turn before retaliation or recovery", () => {
	const state = {
		...encounter(),
		player: { health: 1, maxHealth: 10 },
		effects: [
			{
				actorId: "player",
				floorNumber: null,
				kind: "renewing" as const,
				remaining: 4,
			},
		],
	};
	const result = resolvePlayerAction(state, {
		type: "move",
		direction: "right",
	}).state;
	expect(result.player.health).toBe(0);
	expect(
		result.activityHistory.entries.filter(
			(entry) => entry.event.type === "player-died",
		),
	).toHaveLength(1);
	expect(resolvePlayerAction(result, { type: "wait" }).turnAdvanced).toBe(
		false,
	);
});
it("retains spent trap state through validated save continuation", () => {
	const saved = restoreSave(savedAdventure());
	const state = {
		...saved.state,
		monsters: [],
		objects: [{ ...trap, coordinate: { row: 7, col: 8 } }],
		run: { ...saved.state.run, playerCoordinate: { row: 7, col: 7 } },
	};
	const sprung = resolvePlayerAction(state, {
		type: "move",
		direction: "right",
	}).state;
	const doc = createSaveDocument(
		sprung,
		saved.exploration,
		saved.configuration,
		saved.fog,
	);
	expect(parseSave(serializeSave(doc)).ok).toBe(true);
	expect(restoreSave(doc).state.objects).toEqual(sprung.objects);
});
