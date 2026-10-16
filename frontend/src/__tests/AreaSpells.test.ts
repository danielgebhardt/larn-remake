// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { castSpell } from "../domain/game/SpellCasting";
import { SPELL_DEFINITIONS } from "../domain/game/Spells";
import { createTestDungeonFloor } from "./testhelpers";

const rolls = () => ({ d20: () => 20, damage: (min: number) => min });
const arena = () => {
	const floor = createTestDungeonFloor({
		floorNumber: 1,
		rows: 9,
		cols: 9,
		room: { startRow: 1, endRow: 7, startCol: 1, endCol: 7 },
	});
	const state = createGameState({
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 4, col: 1 },
		floors: [floor],
	});
	const monster = (id: string, row: number, col: number) => ({
		id,
		kind: "orc" as const,
		floorNumber: 1,
		coordinate: { row, col },
		health: 7,
		intent: { type: "idle" as const },
	});
	return {
		...state,
		knownSpells: ["fireball", "frost-nova"] as const,
		monsters: [
			monster("1:2", 4, 4),
			monster("1:1", 4, 3),
			monster("1:3", 4, 6),
		],
	};
};
it("Fireball damages only the chosen area in stable actor order and pays once", () => {
	const initial = arena();
	const resolvedIds: string[] = [];
	const result = castSpell(
		initial,
		{ type: "cast", spell: "fireball", targetId: "1:2" },
		(context) => {
			resolvedIds.push(context.targetId);
			return rolls();
		},
	);
	if (!("state" in result)) throw new Error(result.error);
	expect(result.state.monsters).toEqual([]);
	expect(resolvedIds).toEqual(["1:1", "1:2", "1:3", "player"]);
	expect(result.state.mana).toBe(initial.mana - 8 + 2); // Ordinary level-up mana from three kills.
	// Three kills gain levels before the blast reaches the caster.
	expect(result.state.player.health).toBe(6);
	expect(
		result.state.activityHistory.entries.flatMap((e) =>
			e.event.type === "spell-hit" ? [e.event.damage] : [],
		),
	).toEqual([8, 16, 8]);
});
it("Frost Nova self-casts around the player and slows survivors before retaliation", () => {
	const initial = arena();
	initial.run.playerCoordinate = { row: 4, col: 4 };
	initial.monsters = initial.monsters.filter((m) => m.id !== "1:2");
	const result = resolvePlayerAction(
		initial,
		{ type: "cast", spell: "frost-nova" },
		rolls,
	);
	expect(result.state.turn).toBe(1);
	expect(result.state.mana).toBe(initial.mana - 8);
	expect(result.state.monsters.map((m) => m.health)).toEqual([4, 4]);
	expect(result.state.effects.map((e) => e.remaining)).toEqual([2, 2]);
	expect(result.state.player.health).toBe(10);
});
it("walls block splash damage and an empty Frost Nova is free", () => {
	const initial = arena();
	const terrain = initial.run.floors[0].terrain.map((row) => [...row]);
	terrain[4][3] = "#";
	initial.run.floors[0] = { ...initial.run.floors[0], terrain };
	const result = castSpell(
		initial,
		{ type: "cast", spell: "fireball", targetId: "1:2" },
		rolls,
	);
	expect("error" in result).toBe(true);
	const empty = { ...arena(), monsters: [] };
	expect(
		resolvePlayerAction(empty, { type: "cast", spell: "frost-nova" }, rolls)
			.state,
	).toBe(empty);
});
it("provides twenty functional spell definitions", () =>
	expect(Object.keys(SPELL_DEFINITIONS)).toHaveLength(20));

it("Frost Nova splash stops behind a wall and multi-kills reward each enemy once", () => {
	const initial = arena();
	initial.run.playerCoordinate = { row: 4, col: 4 };
	initial.monsters = initial.monsters.filter((m) => m.id !== "1:2");
	const terrain = initial.run.floors[0].terrain.map((row) => [...row]);
	terrain[4][5] = "#";
	initial.run.floors[0] = { ...initial.run.floors[0], terrain };
	const blocked = castSpell(
		initial,
		{ type: "cast", spell: "frost-nova" },
		rolls,
	);
	if (!("state" in blocked)) throw new Error(blocked.error);
	expect(blocked.state.monsters.map((m) => m.health)).toEqual([4, 7]);
	const weak = arena();
	weak.monsters = weak.monsters.map((m) => ({ ...m, health: 3 }));
	const killed = resolvePlayerAction(
		weak,
		{ type: "cast", spell: "fireball", targetId: "1:2" },
		rolls,
	).state;
	expect(killed.turn).toBe(1);
	expect(killed.monstersDefeated).toBe(3);
	expect(killed.progression.experience).toBe(30);
	expect(killed.monsters).toHaveLength(0);
});
