// @vitest-environment node

import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState.ts";
import { resolvePlayerAction } from "../domain/game/PlayerActions.ts";
import {
	createTestDungeonFloor,
	createThreeFloorTraversalRun,
} from "./testhelpers.ts";

const roomyRun = (seed = 123) => ({
	seed,
	activeFloor: 1,
	playerCoordinate: { row: 2, col: 2 },
	floors: [
		createTestDungeonFloor({
			floorNumber: 1,
			rows: 6,
			cols: 8,
			room: { startRow: 1, endRow: 4, startCol: 1, endCol: 6 },
			downStair: {
				coordinate: { row: 4, col: 6 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		}),
	],
});

describe("Monster occupancy and retention", () => {
	it("attacks an occupied destination while retaining the original player position", () => {
		const initial = createGameState(roomyRun());
		const game = {
			...initial,
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 2, col: 3 },
					health: 3,
				},
			],
		};
		const result = resolvePlayerAction(game, {
			type: "move",
			direction: "right",
		});
		expect(result.turnAdvanced).toBe(true);
		expect(result.state.run).toBe(game.run);
		expect(result.state.turn).toBe(game.turn + 1);
		expect(result.state.monsters[0].health).toBe(1);
		expect(game.monsters[0].health).toBe(3);
	});

	it("retains the same injured monster through ordinary movement and floor revisits", () => {
		const run = createThreeFloorTraversalRun();
		run.floors[0] = createTestDungeonFloor({
			floorNumber: 1,
			rows: 3,
			cols: 5,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 3 },
			downStair: run.floors[0].downStair,
		});
		const initial = createGameState(run);
		const game = {
			...initial,
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 3 },
					health: 2,
				},
			],
		};
		// Descend, walk away from the arrival, then return to the entry stair.
		const down = resolvePlayerAction(game, {
			type: "move",
			direction: "right",
		}).state;
		const away = resolvePlayerAction(down, {
			type: "move",
			direction: "right",
		}).state;
		const up = resolvePlayerAction(away, {
			type: "move",
			direction: "left",
		}).state;
		expect(up.run.activeFloor).toBe(1);
		expect(up.monsters).toBe(game.monsters);
		expect(up.monsters[0].health).toBe(2);
	});
});
