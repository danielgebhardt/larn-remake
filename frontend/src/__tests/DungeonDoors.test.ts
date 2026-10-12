// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { isSpellTarget } from "../domain/game/SpellCasting";
import { SPELL_DEFINITIONS } from "../domain/game/Spells";
import { navigationRun } from "../domain/objects/NavigationTerrain";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const encounter = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	objects: [
		{
			id: "floor:1:object:door:1",
			kind: "door" as const,
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			activated: false,
		},
	],
});
it("bumping a closed door opens it for one turn without moving, then walking passes", () => {
	const initial = encounter();
	const opened = resolvePlayerAction(initial, {
		type: "move",
		direction: "right",
	}).state;
	expect(opened.turn).toBe(1);
	expect(opened.run.playerCoordinate).toEqual(initial.run.playerCoordinate);
	expect(opened.objects[0].activated).toBe(true);
	const entered = resolvePlayerAction(opened, {
		type: "move",
		direction: "right",
	}).state;
	expect(entered.turn).toBe(2);
	expect(entered.run.playerCoordinate).toEqual({ row: 1, col: 2 });
	expect(entered.run.floors[0].terrain[1][2]).toBe(".");
});
it("closed doors block shots, sight and pursuit until opened", () => {
	const initial = encounter();
	const target = {
		id: "1:1",
		kind: "orc" as const,
		floorNumber: 1,
		coordinate: { row: 1, col: 5 },
		health: 7,
		intent: { type: "idle" as const },
		lastDamagedTurn: null,
	};
	const guarded = { ...initial, monsters: [target] };
	expect(
		isSpellTarget(guarded, target, SPELL_DEFINITIONS["magic-missile"]),
	).toBe(false);
	const waited = resolvePlayerAction(guarded, { type: "wait" }).state;
	expect(waited.monsters[0].coordinate).toEqual(target.coordinate);
	const opened = {
		...guarded,
		objects: [{ ...initial.objects[0], activated: true }],
	};
	expect(
		isSpellTarget(opened, target, SPELL_DEFINITIONS["magic-missile"]),
	).toBe(true);
});
it("E-style interaction closes an empty adjacent door but cannot close an occupied one", () => {
	const initial = encounter();
	const opened = {
		...initial,
		objects: [{ ...initial.objects[0], activated: true }],
	};
	const closed = resolvePlayerAction(opened, { type: "interact" }).state;
	expect(closed.objects[0].activated).toBe(false);
	expect(closed.turn).toBe(1);
	const occupied = {
		...opened,
		run: { ...opened.run, playerCoordinate: { row: 1, col: 2 } },
	};
	expect(resolvePlayerAction(occupied, { type: "interact" }).state).toBe(
		occupied,
	);
});
it("navigation reuses unchanged geometry and never mutates the saved base terrain", () => {
	const initial = encounter();
	const first = navigationRun(initial);
	const advanced = { ...initial, turn: 1 };
	const later = navigationRun(advanced);
	expect(first.floors[0].terrain[1][2]).toBe("#");
	expect(later.floors[0].terrain).toBe(first.floors[0].terrain);
	expect(initial.run.floors[0].terrain[1][2]).toBe(".");
});

it("cannot close a door occupied by a monster", () => {
	const initial = encounter();
	const occupied = {
		...initial,
		objects: [{ ...initial.objects[0], activated: true }],
		monsters: [
			{
				id: "1:1",
				kind: "orc" as const,
				floorNumber: 1,
				coordinate: { row: 1, col: 2 },
				health: 7,
				intent: { type: "idle" as const },
				lastDamagedTurn: null,
			},
		],
	};
	expect(resolvePlayerAction(occupied, { type: "interact" }).state).toBe(
		occupied,
	);
});

it("closing a door interrupts a warned blast through that doorway", () => {
	const run = createCorridorEncounter();
	run.playerCoordinate = { row: 1, col: 4 };
	const initial = {
		...createGameState(run),
		objects: [
			{
				id: "floor:1:object:door:1",
				kind: "door" as const,
				floorNumber: 1,
				coordinate: { row: 1, col: 2 },
				activated: true,
			},
		],
		monsters: [
			{
				id: "1:1",
				kind: "salamander" as const,
				floorNumber: 1,
				coordinate: { row: 1, col: 1 },
				health: 24,
				intent: { type: "idle" as const },
				lastDamagedTurn: null,
			},
		],
	};
	const prepared = resolvePlayerAction(initial, { type: "wait" }).state;
	const moved = resolvePlayerAction(prepared, {
		type: "move",
		direction: "left",
	}).state;
	const blocked = resolvePlayerAction(moved, { type: "interact" }).state;
	expect(blocked.player.health).toBe(10);
	expect(blocked.objects[0].activated).toBe(false);
	expect(blocked.activityHistory.entries.at(-1)?.event.type).toBe(
		"monster-area-blocked",
	);
});
