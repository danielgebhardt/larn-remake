// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const lowRolls = () => ({ d20: () => 20, damage: (min: number) => min });
const encounter = (col = 3) => ({
	...createGameState(createCorridorEncounter()),
	knownSpells: ["web", "sleep", "fear"] as const,
	monsters: [
		{
			id: "1:1",
			kind: "orc" as const,
			floorNumber: 1,
			coordinate: { row: 1, col },
			health: 7,
			intent: { type: "idle" as const },
		},
	],
});
it("Web prevents pursuit for three phases but allows an adjacent attack", () => {
	let state = resolvePlayerAction(
		encounter(),
		{ type: "cast", spell: "web", targetId: "1:1" },
		lowRolls,
	).state;
	state = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	state = resolvePlayerAction(state, { type: "wait" }, lowRolls).state;
	expect(state.monsters[0].coordinate).toEqual({ row: 1, col: 3 });
	expect(state.effects).toEqual([]);
	expect(
		resolvePlayerAction(state, { type: "wait" }, lowRolls).state.monsters[0]
			.coordinate,
	).toEqual({ row: 1, col: 2 });
	const adjacent = resolvePlayerAction(
		encounter(2),
		{ type: "cast", spell: "web", targetId: "1:1" },
		lowRolls,
	).state;
	expect(adjacent.player.health).toBe(8);
});
it("Sleep skips actions but damage wakes the monster before its next response", () => {
	const sleeping = resolvePlayerAction(
		encounter(2),
		{ type: "cast", spell: "sleep", targetId: "1:1" },
		lowRolls,
	).state;
	expect(sleeping.player.health).toBe(10);
	expect(sleeping.effects[0].kind).toBe("asleep");
	const struck = resolvePlayerAction(
		sleeping,
		{ type: "move", direction: "right" },
		lowRolls,
	).state;
	expect(struck.effects).toEqual([]);
	expect(struck.monsters[0].health).toBe(6);
	expect(struck.player.health).toBe(8);
});
it("Fear retreats instead of attacking and never enters an occupied tile", () => {
	const retreating = resolvePlayerAction(
		encounter(),
		{ type: "cast", spell: "fear", targetId: "1:1" },
		lowRolls,
	).state;
	expect(retreating.monsters[0].coordinate).toEqual({ row: 1, col: 4 });
	expect(retreating.player.health).toBe(10);
	const initial = encounter();
	const blocked = {
		...initial,
		monsters: [
			...initial.monsters,
			{ ...initial.monsters[0], id: "1:2", coordinate: { row: 1, col: 4 } },
		],
	};
	const after = resolvePlayerAction(
		blocked,
		{ type: "cast", spell: "fear", targetId: "1:1" },
		lowRolls,
	).state;
	expect(after.monsters.find((m) => m.id === "1:1")?.coordinate).toEqual({
		row: 1,
		col: 3,
	});
});
it("Sleep cancels a prepared strike and unaffordable control casts remain free", () => {
	const initial = {
		...encounter(2),
		monsters: [
			{
				...encounter(2).monsters[0],
				kind: "dungeon-brute" as const,
				health: 12,
				intent: {
					type: "preparing-attack" as const,
					target: { row: 1, col: 1 },
				},
			},
		],
	};
	const sleeping = resolvePlayerAction(
		initial,
		{ type: "cast", spell: "sleep", targetId: "1:1" },
		lowRolls,
	).state;
	expect(sleeping.monsters[0].intent).toEqual({ type: "idle" });
	expect(sleeping.player.health).toBe(10);
	const empty = { ...initial, mana: 0 };
	expect(
		resolvePlayerAction(empty, { type: "cast", spell: "fear", targetId: "1:1" })
			.state,
	).toBe(empty);
});

it("Sleep expires after its third active phase and Fear cannot retreat onto stairs", () => {
	let sleeping = resolvePlayerAction(
		encounter(2),
		{ type: "cast", spell: "sleep", targetId: "1:1" },
		lowRolls,
	).state;
	sleeping = resolvePlayerAction(sleeping, { type: "wait" }, lowRolls).state;
	sleeping = resolvePlayerAction(sleeping, { type: "wait" }, lowRolls).state;
	expect(sleeping.effects).toEqual([]);
	expect(sleeping.player.health).toBe(10);
	expect(
		resolvePlayerAction(sleeping, { type: "wait" }, lowRolls).state.player
			.health,
	).toBe(8);
	const initial = encounter(11);
	const nearStairs = {
		...initial,
		run: { ...initial.run, playerCoordinate: { row: 1, col: 9 } },
	};
	const afraid = resolvePlayerAction(
		nearStairs,
		{ type: "cast", spell: "fear", targetId: "1:1" },
		lowRolls,
	).state;
	expect(afraid.monsters[0].coordinate).toEqual({ row: 1, col: 11 });
});
