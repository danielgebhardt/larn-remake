// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { GameState } from "../domain/game/GameState";
import { createGameState } from "../domain/game/GameState";
import { detectsPlayer } from "../domain/monsters/MonsterPursuit";
import { resolveMonsterPhaseWithHits as phase } from "./ControlledCombatTestHelpers";
import { createTestDungeonFloor } from "./testhelpers";

const awarenessEncounter = (): GameState => {
	const floor = createTestDungeonFloor({
		floorNumber: 1,
		rows: 10,
		cols: 10,
		room: { startRow: 1, endRow: 8, startCol: 1, endCol: 8 },
	});
	const initial = createGameState({
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 4, col: 7 },
		floors: [floor],
	});
	return {
		...initial,
		turn: 1,
		objects: [],
		monsters: [
			{
				id: "1:1",
				kind: "goblin",
				floorNumber: 1,
				coordinate: { row: 4, col: 4 },
				health: 4,
				intent: { type: "idle" },
			},
		],
	};
};
const hidePlayer = (state: GameState): GameState => {
	const terrain = state.run.floors[0].terrain.map((row) => [...row]);
	terrain[4][6] = "#";
	terrain[5][6] = "#";
	terrain[5][5] = "#";
	return {
		...state,
		turn: state.turn + 1,
		run: {
			...state.run,
			playerCoordinate: { row: 8, col: 8 },
			floors: [{ ...state.run.floors[0], terrain }],
		},
	};
};
describe("Last-seen pursuit", () => {
	it("pauses memory for sleeping actors and skipped slow phases", () => {
		const hidden = hidePlayer(phase(awarenessEncounter()));
		const sleeping = {
			...hidden,
			effects: [
				{
					actorId: "1:1",
					floorNumber: 1,
					kind: "asleep" as const,
					remaining: 2,
				},
			],
		};
		expect(phase(sleeping).monsters).toBe(sleeping.monsters);
		const slow = {
			...hidden,
			turn: 3,
			monsters: [{ ...hidden.monsters[0], kind: "zombie" as const }],
		};
		expect(phase(slow).monsters).toBe(slow.monsters);
	});
	it("does not advance memory on an inactive floor", () => {
		const hidden = hidePlayer(phase(awarenessEncounter()));
		const inactive = {
			...hidden,
			monsters: [{ ...hidden.monsters[0], floorNumber: 2 }],
		};
		expect(phase(inactive)).toBe(inactive);
	});
	it("continues around cover toward the remembered tile without tracking the hidden player", () => {
		const seen = phase(awarenessEncounter());
		expect(seen.monsters[0].coordinate).toEqual({ row: 4, col: 5 });
		const hidden = hidePlayer(seen);
		expect(detectsPlayer(hidden.run, hidden.monsters[0])).toBe(false);
		const chased = phase(hidden);
		expect(chased.monsters[0].coordinate).toEqual({ row: 3, col: 5 });
		expect(chased.monsters[0].awareness).toMatchObject({
			type: "pursuing",
			target: { row: 4, col: 7 },
		});
		expect(chased.player).toBe(hidden.player);
	});
	it("does not pursue a player it has never detected", () => {
		const hidden = hidePlayer(awarenessEncounter());
		expect(phase(hidden)).toBe(hidden);
	});
	it("refreshes the remembered destination only on renewed detection", () => {
		const seen = phase(awarenessEncounter());
		const reacquired = phase({
			...seen,
			turn: 2,
			run: { ...seen.run, playerCoordinate: { row: 3, col: 7 } },
		});
		expect(reacquired.monsters[0].awareness).toMatchObject({
			type: "pursuing",
			target: { row: 3, col: 7 },
		});
	});
});
