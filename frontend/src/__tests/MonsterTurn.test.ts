// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createTestDungeonFloor } from "./testhelpers";

const encounter = (): GameState => ({
	...createGameState({
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 1, col: 1 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 5,
				cols: 6,
				room: { startRow: 1, endRow: 3, startCol: 1, endCol: 4 },
				downStair: {
					coordinate: { row: 3, col: 4 },
					destinationFloor: 2,
					arrivalCoordinate: { row: 1, col: 1 },
				},
			}),
			createTestDungeonFloor({
				floorNumber: 2,
				rows: 4,
				cols: 5,
				room: { startRow: 1, endRow: 2, startCol: 1, endCol: 3 },
				upStair: {
					coordinate: { row: 1, col: 1 },
					destinationFloor: 1,
					arrivalCoordinate: { row: 3, col: 4 },
				},
			}),
		],
	}),
	monsters: [
		{
			id: "1:1",
			kind: "goblin",
			floorNumber: 1,
			coordinate: { row: 1, col: 3 },
			health: 4,
		},
	],
});
const move = (game: GameState, direction: "up" | "down" | "left" | "right") =>
	resolvePlayerAction(game, { type: "move", direction });

describe("Monster turns", () => {
	it("attacks once when walking into adjacency, after committing the player movement", () => {
		const game = encounter();
		const before = structuredClone(game);
		const result = move(game, "right");
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.turn).toBe(1);
		expect(result.state.run.playerCoordinate).toEqual({ row: 1, col: 2 });
		expect(result.state.player.health).toBe(9);
		expect(result.state.monsters).toBe(game.monsters);
		expect(result.state.activityHistory.entries.map((e) => e.event)).toEqual([
			{ type: "monster-hit", turn: 1, monster: "goblin", damage: 1 },
		]);
		expect(game).toEqual(before);
	});
	it("does not attack diagonally or on a blocked step", () => {
		const game = encounter();
		game.monsters = [{ ...game.monsters[0], coordinate: { row: 2, col: 2 } }];
		const diagonal = move(game, "up");
		expect(diagonal.state).toBe(game);
		game.monsters = [{ ...game.monsters[0], coordinate: { row: 2, col: 3 } }];
		const walked = move(game, "right").state;
		expect(walked.player).toBe(game.player);
		expect(walked.activityHistory).toBe(game.activityHistory);
	});
	it("runs only destination-floor actors after a stair transition", () => {
		const game = encounter();
		game.run = { ...game.run, playerCoordinate: { row: 3, col: 3 } };
		game.monsters = [
			{ ...game.monsters[0], coordinate: { row: 2, col: 4 } },
			{
				...game.monsters[0],
				id: "2:1",
				floorNumber: 2,
				coordinate: { row: 1, col: 2 },
			},
		];
		const result = move(game, "right").state;
		expect(result.run.activeFloor).toBe(2);
		expect(result.turn).toBe(1);
		expect(result.player.health).toBe(9);
		expect(result.monsters).toBe(game.monsters);
		expect(result.activityHistory.entries).toHaveLength(1);
	});
	it("stops the phase at death so subsequent actors cannot attack", () => {
		const game = encounter();
		game.player = { health: 1, maxHealth: 10 };
		game.monsters = [
			{ ...game.monsters[0] },
			{ ...game.monsters[0], id: "1:2", coordinate: { row: 2, col: 2 } },
		];
		const result = move(game, "right").state;
		expect(result.player.health).toBe(0);
		expect(result.activityHistory.entries.map((e) => e.event.type)).toEqual([
			"monster-hit",
			"player-died",
		]);
		expect(move(result, "down").state).toBe(result);
	});
});
