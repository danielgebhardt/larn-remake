// @vitest-environment node
import { describe, expect, it } from "vitest";
import { WALL } from "../domain/dungeon/Tiles";
import { createGameState } from "../domain/game/GameState";
import {
	detectsPlayer,
	selectPursuitStep,
} from "../domain/monsters/MonsterPursuit";
import { resolveMonsterPhase } from "../domain/monsters/MonsterTurns";
import { createTestDungeonFloor } from "./testhelpers";

const encounter = () => {
	const run = {
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 4, col: 7 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 10,
				cols: 10,
				room: { startRow: 1, endRow: 8, startCol: 1, endCol: 8 },
			}),
		],
	};
	return {
		...createGameState(run),
		turn: 1,
		monsters: [
			{
				id: "1:1",
				kind: "goblin" as const,
				floorNumber: 1,
				coordinate: { row: 4, col: 4 },
				health: 4,
			},
		],
	};
};
const withWalls = (
	game: ReturnType<typeof encounter>,
	points: { row: number; col: number }[],
) => {
	const terrain = game.run.floors[0].terrain.map((row) => [...row]);
	for (const point of points) terrain[point.row][point.col] = WALL;
	game.run.floors[0] = { ...game.run.floors[0], terrain };
};

describe("Goblin detection", () => {
	it("includes the radius boundary and excludes tiles beyond it", () => {
		const game = encounter();
		const monster = { ...game.monsters[0], coordinate: { row: 1, col: 1 } };
		expect(
			detectsPlayer(
				{ ...game.run, playerCoordinate: { row: 1, col: 7 } },
				monster,
			),
		).toBe(true);
		expect(
			detectsPlayer(
				{ ...game.run, playerCoordinate: { row: 1, col: 8 } },
				monster,
			),
		).toBe(false);
		expect(
			detectsPlayer(
				{ ...game.run, playerCoordinate: { row: 6, col: 6 } },
				monster,
			),
		).toBe(false);
	});
	it("stays still behind a wall and resumes only when the player is currently detectable", () => {
		const game = encounter();
		withWalls(game, [{ row: 4, col: 5 }]);
		expect(detectsPlayer(game.run, game.monsters[0])).toBe(false);
		expect(resolveMonsterPhase(game)).toBe(game);
		const seen = {
			...game,
			run: { ...game.run, playerCoordinate: { row: 3, col: 4 } },
		};
		expect(resolveMonsterPhase(seen).player.health).toBe(9);
	});
	it("does not see through two touching wall corners", () => {
		const game = encounter();
		game.run.playerCoordinate = { row: 5, col: 5 };
		withWalls(game, [
			{ row: 4, col: 5 },
			{ row: 5, col: 4 },
		]);
		expect(detectsPlayer(game.run, game.monsters[0])).toBe(false);
	});
});

describe("One-step pursuit", () => {
	it("moves toward detection without also attacking or logging movement", () => {
		const game = encounter();
		game.run.playerCoordinate = { row: 4, col: 6 };
		const before = structuredClone(game);
		const result = resolveMonsterPhase(game);
		expect(result.monsters[0].coordinate).toEqual({ row: 4, col: 5 });
		expect(result.player).toBe(game.player);
		expect(result.activityHistory).toBe(game.activityHistory);
		expect(result.run).toBe(game.run);
		expect(game).toEqual(before);
		const next = resolveMonsterPhase({ ...result, turn: 2 });
		expect(next.player.health).toBe(9);
		expect(next.monsters).toBe(result.monsters);
	});
	it("uses up before left for equally short approaches", () => {
		const game = encounter();
		game.run.playerCoordinate = { row: 2, col: 2 };
		expect(
			selectPursuitStep(game.run, game.monsters[0], game.monsters),
		).toEqual({ row: 3, col: 4 });
	});
	it("routes around an obstacle instead of greedily getting stuck", () => {
		const game = encounter();
		withWalls(game, [{ row: 4, col: 5 }]);
		expect(
			selectPursuitStep(game.run, game.monsters[0], game.monsters),
		).toEqual({ row: 3, col: 4 });
	});
	it("stays still when all routes are blocked", () => {
		const game = encounter();
		withWalls(game, [
			{ row: 3, col: 4 },
			{ row: 4, col: 5 },
			{ row: 5, col: 4 },
			{ row: 4, col: 3 },
		]);
		expect(
			selectPursuitStep(game.run, game.monsters[0], game.monsters),
		).toBeUndefined();
	});
	it("never walks onto stairs or their linked arrival coordinates", () => {
		const game = encounter();
		game.run.floors[0] = {
			...game.run.floors[0],
			downStair: {
				coordinate: { row: 4, col: 5 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		};
		expect(
			selectPursuitStep(game.run, game.monsters[0], game.monsters),
		).toEqual({ row: 3, col: 4 });
		game.run.floors.push(
			createTestDungeonFloor({
				floorNumber: 2,
				rows: 3,
				cols: 4,
				room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
				upStair: {
					coordinate: { row: 1, col: 1 },
					destinationFloor: 1,
					arrivalCoordinate: { row: 3, col: 4 },
				},
			}),
		);
		expect(
			selectPursuitStep(game.run, game.monsters[0], game.monsters),
		).toEqual({ row: 5, col: 4 });
	});
	it("attacks an adjacent player on a stair but does not enter it", () => {
		const game = encounter();
		game.run.playerCoordinate = { row: 4, col: 5 };
		game.run.floors[0] = {
			...game.run.floors[0],
			downStair: {
				coordinate: { row: 4, col: 5 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		};
		const result = resolveMonsterPhase(game);
		expect(result.player.health).toBe(9);
		expect(result.monsters).toBe(game.monsters);
	});
});
