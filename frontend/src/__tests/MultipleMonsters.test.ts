// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import type { Monster } from "../domain/monsters/Monster";
import { resolveMonsterPhase } from "../domain/monsters/MonsterTurns";
import { createTestDungeonFloor } from "./testhelpers";

const goblin = (index: number, col: number, health = 4): Monster => ({
	id: `1:${index}`,
	kind: "goblin",
	floorNumber: 1,
	coordinate: { row: 1, col },
	health,
});
const corridor = () => ({
	...createGameState({
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 1, col: 1 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 3,
				cols: 8,
				room: { startRow: 1, endRow: 1, startCol: 1, endCol: 6 },
			}),
		],
	}),
	turn: 1,
	monsters: [goblin(1, 3), goblin(2, 4)],
});

describe("Multiple monster turns", () => {
	it("uses spawn order even if the actor array is reversed, letting a later actor follow into a vacated tile", () => {
		const game = corridor();
		game.run = {
			...game.run,
			playerCoordinate: { row: 1, col: 3 },
			floors: [
				createTestDungeonFloor({
					floorNumber: 1,
					rows: 6,
					cols: 7,
					room: { startRow: 1, endRow: 4, startCol: 1, endCol: 5 },
				}),
			],
		};
		game.monsters = [
			{ ...goblin(1, 3), coordinate: { row: 3, col: 3 } },
			{ ...goblin(2, 3), coordinate: { row: 4, col: 3 } },
		];
		const before = structuredClone(game);
		const ordered = resolveMonsterPhase(game);
		const reversed = resolveMonsterPhase({
			...game,
			monsters: [...game.monsters].reverse(),
		});
		for (const result of [ordered, reversed]) {
			expect(result.monsters.find((m) => m.id === "1:1")?.coordinate).toEqual({
				row: 2,
				col: 3,
			});
			expect(result.monsters.find((m) => m.id === "1:2")?.coordinate).toEqual({
				row: 3,
				col: 3,
			});
			expect(result.player.health).toBe(10);
			expect(result.activityHistory.entries).toEqual([]);
		}
		expect(game).toEqual(before);
	});
	it("does not walk through a monster blocking the only corridor route", () => {
		const game = corridor();
		game.monsters = [goblin(1, 2), goblin(2, 3)];
		const result = resolveMonsterPhase(game);
		expect(result.monsters).toBe(game.monsters);
		expect(result.player.health).toBe(9);
		expect(result.activityHistory.entries).toHaveLength(1);
	});
	it("orders numeric spawn indices and stops before later actors move on a fatal hit", () => {
		const game = corridor();
		game.player = { health: 1, maxHealth: 10 };
		game.run = {
			...game.run,
			floors: [
				createTestDungeonFloor({
					floorNumber: 1,
					rows: 5,
					cols: 7,
					room: { startRow: 1, endRow: 3, startCol: 1, endCol: 5 },
				}),
			],
		};
		game.monsters = [
			{ ...goblin(10, 3), coordinate: { row: 3, col: 3 } },
			goblin(2, 2),
		];
		const result = resolveMonsterPhase(game);
		expect(result.monsters).toBe(game.monsters);
		expect(result.player.health).toBe(0);
		expect(result.activityHistory.entries.map((e) => e.event.type)).toEqual([
			"monster-hit",
			"player-died",
		]);
	});
	it("lets several adjacent monsters attack once each on the same turn", () => {
		const game = corridor();
		game.run = { ...game.run, playerCoordinate: { row: 1, col: 3 } };
		game.monsters = [goblin(2, 4), goblin(1, 2)];
		const result = resolveMonsterPhase(game);
		expect(result.player.health).toBe(8);
		expect(result.monsters).toBe(game.monsters);
		expect(result.activityHistory.entries.map((e) => e.event)).toEqual([
			{ type: "monster-hit", monster: "goblin", damage: 1, turn: 1 },
			{ type: "monster-hit", monster: "goblin", damage: 1, turn: 1 },
		]);
	});
	it("kills only the bumped actor and still permits a different adjacent actor to attack", () => {
		const game = corridor();
		game.run = { ...game.run, playerCoordinate: { row: 1, col: 3 } };
		game.monsters = [goblin(1, 4, 2), goblin(2, 2)];
		const result = resolvePlayerAction(game, {
			type: "move",
			direction: "right",
		}).state;
		expect(result.monsters).toEqual([game.monsters[1]]);
		expect(result.player.health).toBe(9);
		expect(result.run).toBe(game.run);
		expect(result.activityHistory.entries.map((e) => e.event.type)).toEqual([
			"player-hit",
			"monster-died",
			"monster-loot",
			"monster-hit",
		]);
	});
	it("leaves inactive-floor and dead actors untouched", () => {
		const game = corridor();
		game.monsters = [
			goblin(1, 2, 0),
			{ ...goblin(2, 3), floorNumber: 2, id: "2:2" },
		];
		expect(resolveMonsterPhase(game)).toBe(game);
	});
});
