// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import type { Monster } from "../domain/monsters/Monster";
import { advanceUnseenPursuit } from "../domain/monsters/MonsterAwareness";
import { resolveMonsterPhase } from "../domain/monsters/MonsterTurns";
import { ESCAPE_PURSUIT_RULES } from "../domain/monsters/PursuitRules";
import { createTestDungeonFloor } from "./testhelpers";

const encounter = () => ({
	...createGameState({
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 1, col: 9 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 12,
				cols: 12,
				room: { startRow: 1, endRow: 10, startCol: 1, endCol: 10 },
			}),
		],
	}),
	turn: 1,
	objects: [],
	monsters: [
		{
			id: "1:1",
			kind: "goblin" as const,
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			health: 4,
			intent: { type: "idle" as const },
		},
	],
});
describe("Bounded hunted-return pursuit", () => {
	it("extends detection for surviving original actors only during escape", () => {
		const ordinary = encounter();
		expect(resolveMonsterPhase(ordinary)).toBe(ordinary);
		const hunted = {
			...ordinary,
			quest: { ...ordinary.quest, cureRecovered: true },
			escape: { startedTurn: 0, activatedFloors: [] },
		};
		const after = resolveMonsterPhase(hunted);
		expect(after.monsters[0].coordinate).toEqual({ row: 1, col: 3 });
		expect(after.monsters[0].awareness).toMatchObject({
			type: "pursuing",
			remaining: 18,
		});
		expect(after.player).toBe(hunted.player);
	});
	it("still respects walls and pauses inactive-floor awareness", () => {
		const state = encounter();
		const terrain = state.run.floors[0].terrain.map((row) => [...row]);
		terrain[1][5] = "#";
		const hunted = {
			...state,
			run: { ...state.run, floors: [{ ...state.run.floors[0], terrain }] },
			escape: { startedTurn: 0, activatedFloors: [] },
			quest: { ...state.quest, cureRecovered: true },
		};
		expect(resolveMonsterPhase(hunted)).toBe(hunted);
		const paused = {
			...hunted,
			monsters: [{ ...hunted.monsters[0], floorNumber: 2 }],
		};
		expect(resolveMonsterPhase(paused)).toBe(paused);
	});
	it("searches four active phases then disengages without tracking the hidden player", () => {
		const state = encounter();
		let monster: Monster = {
			...state.monsters[0],
			awareness: {
				type: "searching" as const,
				target: { row: 1, col: 2 },
				remaining: 4,
			},
		};
		for (let phase = 0; phase < 3; phase++)
			monster = advanceUnseenPursuit(
				state.run,
				monster,
				[monster],
				ESCAPE_PURSUIT_RULES,
			);
		expect(monster.awareness).toMatchObject({
			type: "searching",
			remaining: 1,
		});
		expect(
			advanceUnseenPursuit(state.run, monster, [monster], ESCAPE_PURSUIT_RULES)
				.awareness,
		).toEqual({ type: "idle" });
	});
});
