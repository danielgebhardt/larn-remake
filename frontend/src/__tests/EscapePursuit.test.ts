// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import type { Monster } from "../domain/monsters/Monster";
import { advanceUnseenPursuit } from "../domain/monsters/MonsterAwareness";
import { orthogonalDistance } from "../domain/monsters/MonsterLocations";
import { sensesCure } from "../domain/monsters/MonsterPursuit";
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
	it.each(["rooted", "asleep", "afraid"] as const)(
		"cure sensing preserves %s counterplay",
		(kind) => {
			const state = encounter();
			const hunted = {
				...state,
				quest: { ...state.quest, cureRecovered: true },
				escape: { startedTurn: 0, activatedFloors: [] },
				effects: [
					{ actorId: state.monsters[0].id, floorNumber: 1, kind, remaining: 3 },
				],
			};
			const after = resolveMonsterPhase(hunted);
			expect(after.player).toEqual(state.player);
			if (kind === "afraid")
				expect(
					orthogonalDistance(
						after.monsters[0].coordinate,
						state.run.playerCoordinate,
					),
				).toBeGreaterThan(
					orthogonalDistance(
						state.monsters[0].coordinate,
						state.run.playerCoordinate,
					),
				);
			else
				expect(after.monsters[0].coordinate).toEqual(
					state.monsters[0].coordinate,
				);
		},
	);
	it("door-opening hunters approach and open an ordinary door without walking through it", () => {
		const state = encounter();
		const terrain = state.run.floors[0].terrain.map((row, index) =>
			index === 1 ? [...row] : row.map(() => "#"),
		);
		let hunted: GameState = {
			...state,
			quest: { ...state.quest, cureRecovered: true },
			escape: { startedTurn: 0, activatedFloors: [] },
			run: { ...state.run, floors: [{ ...state.run.floors[0], terrain }] },
			objects: [
				{
					id: "door",
					kind: "door" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 5 },
					activated: false,
				},
			],
			monsters: [
				{ ...state.monsters[0], kind: "necromancer" as const, health: 28 },
			],
		};
		for (let index = 0; index < 2; index++)
			hunted = resolveMonsterPhase(hunted);
		expect(hunted.monsters[0].coordinate).toEqual({ row: 1, col: 4 });
		expect(hunted.objects[0].activated).toBe(false);
		const opened = resolveMonsterPhase(hunted);
		expect(opened.objects[0].activated).toBe(true);
		expect(opened.monsters[0].coordinate).toEqual({ row: 1, col: 4 });
	});
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
	it("senses through walls but walks around them, without granting attacks through walls", () => {
		const state = encounter();
		const terrain = state.run.floors[0].terrain.map((row) => [...row]);
		terrain[1][5] = "#";
		const hunted = {
			...state,
			run: { ...state.run, floors: [{ ...state.run.floors[0], terrain }] },
			escape: { startedTurn: 0, activatedFloors: [] },
			quest: { ...state.quest, cureRecovered: true },
		};
		const after = resolveMonsterPhase(hunted);
		expect(after.monsters[0].coordinate).toEqual({ row: 1, col: 3 });
		expect(after.monsters[0].awareness).toMatchObject({
			type: "pursuing",
			target: hunted.run.playerCoordinate,
		});
		expect(after.player).toEqual(hunted.player);
		const paused = {
			...hunted,
			monsters: [{ ...hunted.monsters[0], floorNumber: 2 }],
		};
		expect(resolveMonsterPhase(paused)).toBe(paused);
	});
	it("bounds cure sensing to 24 orthogonal tiles on the active floor", () => {
		const state = encounter();
		const monster = { ...state.monsters[0], coordinate: { row: 1, col: 1 } };
		const run = { ...state.run, playerCoordinate: { row: 1, col: 25 } };
		expect(sensesCure(run, monster, ESCAPE_PURSUIT_RULES)).toBe(true);
		expect(
			sensesCure(
				{ ...run, playerCoordinate: { row: 1, col: 26 } },
				monster,
				ESCAPE_PURSUIT_RULES,
			),
		).toBe(false);
		expect(
			sensesCure(run, { ...monster, floorNumber: 2 }, ESCAPE_PURSUIT_RULES),
		).toBe(false);
	});
	it("updates the sensed target behind a wall without permitting a caster to shoot through it", () => {
		const state = encounter();
		const terrain = state.run.floors[0].terrain.map((row) => [...row]);
		terrain[1][4] = "#";
		const hunted = {
			...state,
			run: {
				...state.run,
				playerCoordinate: { row: 1, col: 6 },
				floors: [{ ...state.run.floors[0], terrain }],
			},
			quest: { ...state.quest, cureRecovered: true },
			escape: { startedTurn: 0, activatedFloors: [] },
			monsters: [
				{ ...state.monsters[0], kind: "necromancer" as const, health: 28 },
			],
		};
		const after = resolveMonsterPhase(hunted, () => {
			throw new Error("Hidden caster must not attack");
		});
		expect(after.player).toEqual(hunted.player);
		expect(after.monsters[0].awareness).toMatchObject({
			type: "pursuing",
			target: { row: 1, col: 6 },
		});
		const moved = resolveMonsterPhase({
			...after,
			turn: 2,
			run: { ...after.run, playerCoordinate: { row: 2, col: 7 } },
		});
		expect(moved.monsters[0].awareness).toMatchObject({
			type: "pursuing",
			target: { row: 2, col: 7 },
		});
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
