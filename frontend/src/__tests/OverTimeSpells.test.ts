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

const lowRolls = () => ({ d20: () => 20, damage: (min: number) => min });
it("Poison Dart ticks after monster actions and rewards its eventual kill exactly once", () => {
	const initial = {
		...createGameState(createCorridorEncounter()),
		knownSpells: ["poison-dart"] as const,
		monsters: [
			{
				id: "1:1",
				kind: "orc" as const,
				floorNumber: 1,
				coordinate: { row: 1, col: 3 },
				health: 14,
				intent: { type: "idle" as const },
			},
		],
	};
	let state = resolvePlayerAction(
		initial,
		{ type: "cast", spell: "poison-dart", targetId: "1:1" },
		lowRolls,
	).state;
	expect(state.monsters[0].health).toBe(8);
	expect(state.effects[0].remaining).toBe(2);
	state = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	expect(state.monsters[0].health).toBe(4);
	state = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	expect(state.monsters).toEqual([]);
	expect(state.effects).toEqual([]);
	expect(state.monstersDefeated).toBe(1);
	expect(state.progression.experience).toBe(10);
	expect(
		resolvePlayerAction(state, { type: "wait" }, lowRolls).state.progression
			.experience,
	).toBe(10);
});
it("Renewal heals two per committed turn for four phases, caps recovery and does not revive a dead player", () => {
	const initial = {
		...createGameState(createCorridorEncounter()),
		knownSpells: ["renewal"] as const,
		player: { health: 2, maxHealth: 10 },
		monsters: [],
	};
	let state = resolvePlayerAction(
		initial,
		{ type: "cast", spell: "renewal" },
		lowRolls,
	).state;
	expect(state.player.health).toBe(4);
	expect(state.effects[0].remaining).toBe(3);
	for (let i = 0; i < 3; i++)
		state = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	expect(state.player.health).toBe(10);
	expect(state.effects).toEqual([]);
	const fatal = {
		...initial,
		player: { health: 1, maxHealth: 10 },
		monsters: [
			{
				id: "1:1",
				kind: "orc" as const,
				floorNumber: 1,
				coordinate: { row: 1, col: 2 },
				health: 7,
				intent: { type: "idle" as const },
			},
		],
	};
	expect(
		resolvePlayerAction(fatal, { type: "cast", spell: "renewal" }, lowRolls)
			.state.player.health,
	).toBe(0);
});
it("persists a player renewal effect across floors and saved continuation", () => {
	const saved = savedAdventure();
	const restored = restoreSave(saved);
	const initial = {
		...restored.state,
		knownSpells: [...restored.state.knownSpells, "renewal"] as const,
		monsters: [],
		player: { health: 2, maxHealth: 10 },
	};
	const renewing = resolvePlayerAction(
		initial,
		{ type: "cast", spell: "renewal" },
		lowRolls,
	).state;
	const arrival = renewing.run.floors[1].upStair;
	if (!arrival) throw new Error("Fixture needs an up stair");
	const onNextFloor = {
		...renewing,
		run: {
			...renewing.run,
			activeFloor: 2,
			playerCoordinate: arrival.coordinate,
		},
	};
	const parsed = parseSave(
		serializeSave(
			createSaveDocument(
				onNextFloor,
				restored.exploration,
				restored.configuration,
				restored.fog,
			),
		),
	);
	expect(parsed.ok).toBe(true);
	if (!parsed.ok) throw new Error(parsed.error);
	const next = resolvePlayerAction(
		restoreSave(parsed.value).state,
		{ type: "wait" },
		lowRolls,
	).state;
	expect(next.player.health).toBe(6);
	expect(next.effects[0].remaining).toBe(2);
});
