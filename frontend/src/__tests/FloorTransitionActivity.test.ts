// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatActivityEvent } from "../components/game/ActivityMessages";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerActionWithHits as resolvePlayerAction } from "./ControlledCombatTestHelpers";
import { createThreeFloorTraversalRun } from "./testhelpers";

const quietRun = (): GameState => ({
	...createGameState(createThreeFloorTraversalRun()),
	monsters: [],
	floorItems: [],
});
const messages = (state: GameState) =>
	state.activityHistory.entries.map(({ event }) => formatActivityEvent(event));

describe("Floor transition activity", () => {
	it("announces descent once on the movement turn", () => {
		const before = { ...quietRun(), turn: 7 };
		const result = resolvePlayerAction(before, {
			type: "move",
			direction: "right",
		});
		expect(result.state.run.activeFloor).toBe(2);
		expect(result.state.turn).toBe(8);
		expect(messages(result.state)).toEqual([
			"Turn 8 — You descend to floor 2.",
		]);
		expect(before.activityHistory.entries).toEqual([]);
	});
	it("announces ascent back to a cleared floor without restoring its contents", () => {
		const descended = resolvePlayerAction(quietRun(), {
			type: "move",
			direction: "right",
		}).state;
		const away = resolvePlayerAction(descended, {
			type: "move",
			direction: "right",
		}).state;
		const returned = resolvePlayerAction(away, {
			type: "move",
			direction: "left",
		}).state;
		expect(returned.run.activeFloor).toBe(1);
		expect(returned.monsters).toBe(away.monsters);
		expect(returned.floorItems).toBe(away.floorItems);
		expect(messages(returned)).toEqual([
			"Turn 1 — You descend to floor 2.",
			"Turn 3 — You ascend to floor 1.",
		]);
	});
	it("announces the destination before arrival loot and its monster phase", () => {
		const before: GameState = {
			...quietRun(),
			floorItems: [
				{
					item: { id: "arrival-potion", kind: "healing-potion" },
					floorNumber: 2,
					coordinate: { row: 1, col: 1 },
				},
			],
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "2:1",
					kind: "goblin",
					floorNumber: 2,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			],
		};
		const arrived = resolvePlayerAction(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(messages(arrived)).toEqual([
			"Turn 1 — You descend to floor 2.",
			"Turn 1 — You see Healing potion here.",
			"Turn 1 — The goblin hits you for 1 damage.",
		]);
	});
	it("does not announce waiting on an arrival stair or ordinary and blocked steps", () => {
		let state = resolvePlayerAction(quietRun(), {
			type: "move",
			direction: "right",
		}).state;
		const history = state.activityHistory;
		state = resolvePlayerAction(state, { type: "wait" }).state;
		state = resolvePlayerAction(state, { type: "move", direction: "up" }).state;
		state = resolvePlayerAction(state, {
			type: "move",
			direction: "right",
		}).state;
		expect(state.run.activeFloor).toBe(2);
		expect(state.turn).toBe(3);
		expect(state.activityHistory).toBe(history);
	});
	it("leaves history and turns intact if an invalid stair destination throws", () => {
		const before = quietRun();
		const stair = before.run.floors[0].downStair;
		if (!stair) throw new Error("Fixture needs a down stair.");
		before.run.floors[0].downStair = {
			...stair,
			destinationFloor: 99,
		};
		const snapshot = structuredClone(before);
		expect(() =>
			resolvePlayerAction(before, { type: "move", direction: "right" }),
		).toThrow(/destination/);
		expect(before).toEqual(snapshot);
	});
});
