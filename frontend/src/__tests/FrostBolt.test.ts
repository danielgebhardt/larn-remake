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
const encounter = () => ({
	...createGameState(createCorridorEncounter()),
	knownSpells: ["magic-missile", "heal", "frost-bolt"] as const,
	monsters: [
		{
			id: "1:1",
			kind: "orc" as const,
			floorNumber: 1,
			coordinate: { row: 1, col: 3 },
			health: 7,
			intent: { type: "idle" as const },
		},
	],
});
it("slows three monster phases including the cast, skips alternating actions, then expires", () => {
	let state = resolvePlayerAction(
		encounter(),
		{ type: "cast", spell: "frost-bolt", targetId: "1:1" },
		lowRolls,
	).state;
	expect(state.turn).toBe(1);
	expect(state.monsters[0].health).toBe(5);
	expect(state.monsters[0].coordinate).toEqual({ row: 1, col: 3 });
	expect(state.effects).toEqual([
		{ actorId: "1:1", floorNumber: 1, kind: "slowed", remaining: 2 },
	]);
	state = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	expect(state.monsters[0].coordinate).toEqual({ row: 1, col: 2 });
	state = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	expect(state.player.health).toBe(10);
	expect(state.effects).toEqual([]);
	state = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	expect(state.player.health).toBe(8);
});
it("refreshes instead of stacking and leaves timers unchanged after rejected actions", () => {
	const first = resolvePlayerAction(
		encounter(),
		{ type: "cast", spell: "frost-bolt", targetId: "1:1" },
		lowRolls,
	).state;
	expect(
		resolvePlayerAction(first, { type: "pickup", itemId: "absent" }).state,
	).toBe(first);
	const refreshed = resolvePlayerAction(
		first,
		{ type: "cast", spell: "frost-bolt", targetId: "1:1" },
		lowRolls,
	).state;
	expect(refreshed.effects).toHaveLength(1);
	expect(refreshed.effects[0].remaining).toBe(2);
	expect(refreshed.monsters[0].coordinate).toEqual({ row: 1, col: 3 });
});
it("pauses effects on inactive floors and preserves them through save continuation", () => {
	const saved = savedAdventure();
	const restored = restoreSave(saved);
	const actor = restored.state.monsters.find((m) => m.floorNumber === 2);
	if (!actor) throw new Error("Need an inactive actor");
	const state = {
		...restored.state,
		effects: [
			{
				actorId: actor.id,
				floorNumber: 2,
				kind: "slowed" as const,
				remaining: 2,
			},
		],
	};
	const waited = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	expect(waited.effects).toEqual(state.effects);
	const parsed = parseSave(
		serializeSave(
			createSaveDocument(
				waited,
				restored.exploration,
				restored.configuration,
				restored.fog,
			),
		),
	);
	expect(parsed.ok).toBe(true);
	if (!parsed.ok) throw new Error(parsed.error);
	expect(
		resolvePlayerAction(
			restoreSave(parsed.value).state,
			{ type: "wait" },
			lowRolls,
		).state,
	).toEqual(resolvePlayerAction(waited, { type: "wait" }, lowRolls).state);
});

it.each([
	{ actorId: "missing" },
	{ remaining: 0 },
	{ remaining: 4 },
	{ kind: "unknown" },
	{ floorNumber: 20 },
])("rejects invalid saved conditions %j", (overrides) => {
	const saved = savedAdventure();
	const actor = saved.state.monsters[0];
	const effect = {
		actorId: actor.id,
		floorNumber: actor.floorNumber,
		kind: "slowed",
		remaining: 2,
		...overrides,
	};
	expect(
		parseSave(
			JSON.stringify({
				...saved,
				state: { ...saved.state, effects: [effect] },
			}),
		).ok,
	).toBe(false);
});
