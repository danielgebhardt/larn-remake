// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Coordinate } from "../domain/dungeon/DungeonTypes";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createBag } from "../domain/items/Bag";
import {
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { resolvePlayerActionWithHits as act } from "./ControlledCombatTestHelpers";
import { tacticalSnapshot } from "./TacticalReplayTestHelpers";
import { createTestDungeonFloor, findFloorPath } from "./testhelpers";

// Short, two-row rooms keep the full five-floor adventure readable.
// Landed nominal hits isolate turn ordering; real seeded replay has its own suite.
const adventure = (): GameState => {
	const run = {
		seed: 0,
		activeFloor: 1,
		playerCoordinate: { row: 1, col: 1 },
		floors: Array.from({ length: 5 }, (_, index) =>
			createTestDungeonFloor({
				floorNumber: index + 1,
				rows: 15,
				cols: 15,
				room: { startRow: 1, endRow: 2, startCol: 1, endCol: 7 },
				...(index > 0
					? {
							upStair: {
								coordinate: { row: 1, col: 1 },
								destinationFloor: index,
								arrivalCoordinate: { row: 1, col: 7 },
							},
						}
					: {}),
				...(index < 4
					? {
							downStair: {
								coordinate: { row: 1, col: 7 },
								destinationFloor: index + 2,
								arrivalCoordinate: { row: 1, col: 1 },
							},
						}
					: {}),
			}),
		),
	};
	return {
		...createGameState(run),
		objects: [],
		bag: createBag([{ id: "health", kind: "healing-potion" }]),
		monsters: [
			{
				id: "2:1",
				kind: "goblin-archer",
				floorNumber: 2,
				coordinate: { row: 2, col: 4 },
				health: 5,
				intent: { type: "idle" },
			},
			{
				id: "4:1",
				kind: "dungeon-brute",
				floorNumber: 4,
				coordinate: { row: 2, col: 4 },
				health: 10,
				intent: { type: "idle" },
			},
		],
		floorItems: [
			{
				item: { id: "quest:cure", kind: "cure" },
				floorNumber: 5,
				coordinate: { row: 2, col: 6 },
			},
		],
	};
};
const walk = (before: GameState, target: Coordinate) => {
	let state = before;
	const path = findFloorPath(
		state.run.floors[state.run.activeFloor - 1].terrain,
		state.run.playerCoordinate,
		target,
	);
	for (const point of path.slice(1)) {
		const previous = state.run.playerCoordinate;
		const direction =
			point.row < previous.row
				? "up"
				: point.row > previous.row
					? "down"
					: point.col < previous.col
						? "left"
						: "right";
		state = act(state, { type: "move", direction }).state;
		expect(state.player.health).toBeGreaterThan(0);
		if (state.run.activeFloor === before.run.activeFloor)
			expect(state.run.playerCoordinate).toEqual(point);
		else expect(point).toEqual(target);
	}
	return state;
};

describe("Complete adventure with tactical encounters", () => {
	it("handles shots, a saved preparation, a dodge, recovery, rewards, cure return and fresh replay", () => {
		const fresh = adventure();
		let state = walk(fresh, { row: 1, col: 7 });
		expect(state.run.activeFloor).toBe(2);
		state = walk(state, { row: 1, col: 2 });
		expect(
			state.activityHistory.entries.some(
				({ event }) => event.type === "monster-shot-hit",
			),
		).toBe(true);
		for (let cast = 0; cast < 2; cast++)
			state = act(state, {
				type: "cast",
				spell: "magic-missile",
				targetId: "2:1",
			}).state;
		expect(state.monsters.some(({ id }) => id === "2:1")).toBe(false);
		expect(state.progression.experience).toBe(6);
		state = walk(state, { row: 1, col: 7 });
		state = walk(state, { row: 1, col: 7 });
		expect(state.run.activeFloor).toBe(4);
		state = walk(state, { row: 1, col: 2 });
		state = act(state, { type: "wait" }).state;
		expect(state.monsters[0].intent).toEqual({
			type: "preparing-attack",
			target: { row: 1, col: 2 },
		});

		const parsed = parseSave(serializeSave(tacticalSnapshot(state)));
		if (!parsed.ok) throw new Error(parsed.error);
		state = restoreSave(parsed.value).state;
		state = act(state, { type: "move", direction: "down" }).state;
		expect(state.activityHistory.entries.at(-1)?.event.type).toBe(
			"monster-heavy-avoided",
		);
		state = act(state, { type: "move", direction: "up" }).state;
		state = act(state, {
			type: "cast",
			spell: "magic-missile",
			targetId: "4:1",
		}).state;
		state = act(state, { type: "consume", itemId: "health" }).state;
		for (let hit = 0; hit < 3; hit++)
			state = act(state, { type: "move", direction: "right" }).state;
		expect(state.monsters).toEqual([]);
		expect(state.monstersDefeated).toBe(2);
		expect(state.progression.experience).toBe(18);
		expect(state.bag.items).toEqual([]);
		expect(state.player.health).toBeGreaterThan(0);

		state = walk(state, { row: 1, col: 7 });
		expect(state.run.activeFloor).toBe(5);
		state = walk(state, { row: 2, col: 6 });
		state = act(state, { type: "pickup", itemId: "quest:cure" }).state;
		expect(state.quest.cureRecovered).toBe(true);
		for (let floor = 5; floor > 1; floor--) {
			state = walk(state, { row: 1, col: 1 });
			expect(state.run.activeFloor).toBe(floor - 1);
			expect(state.monsters).toEqual([]);
		}
		state = walk(state, state.quest.entrance);
		expect(state.quest.victory).toMatchObject({
			seed: 0,
			floors: 5,
			monstersDefeated: 2,
			level: 2,
			experience: 18,
			turns: state.turn,
		});
		expect(resolvePlayerAction(state, { type: "wait" }).state).toBe(state);
		expect(adventure()).toEqual(fresh);
		expect(
			fresh.monsters.every(
				({ intent, health, kind }) =>
					intent.type === "idle" &&
					health === (kind === "goblin-archer" ? 5 : 10),
			),
		).toBe(true);
	});
});
