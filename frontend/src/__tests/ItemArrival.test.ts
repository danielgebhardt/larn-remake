// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatActivityEvent } from "../components/game/ActivityMessages";
import { createGameState, type GameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import type { FloorItem } from "../domain/items/FloorItems";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const loot = (
	id: string,
	kind: FloorItem["item"]["kind"],
	col = 2,
	floorNumber = 1,
): FloorItem => ({
	item: { id, kind },
	floorNumber,
	coordinate: { row: 1, col },
});
const game = () => ({
	...createGameState(createCorridorEncounter()),
	monsters: [],
	floorItems: [loot("potion", "healing-potion")],
});
const right = { type: "move", direction: "right" } as const;
const observations = (state: GameState) =>
	state.activityHistory.entries.filter(
		(entry) => entry.event.type === "items-seen",
	);

describe("Arriving at floor items", () => {
	it("announces the current tile's items once using the movement turn", () => {
		const before = {
			...game(),
			floorItems: [
				loot("potion", "healing-potion"),
				loot("sword", "iron-sword"),
				loot("potion2", "healing-potion"),
				loot("hidden", "wooden-shield", 3),
				loot("other-floor", "short-sword", 2, 2),
			],
		};
		const snapshot = structuredClone(before);
		const result = resolvePlayerAction(before, right).state;
		expect(result.turn).toBe(1);
		expect(result.activityHistory.entries).toHaveLength(1);
		expect(formatActivityEvent(result.activityHistory.entries[0].event)).toBe(
			"Turn 1 — You see Healing potion, Iron sword, and Healing potion here.",
		);
		expect(before).toEqual(snapshot);
	});
	it("announces destination-floor items after stairs", () => {
		const before = game();
		const result = resolvePlayerAction(
			{
				...before,
				run: { ...before.run, playerCoordinate: { row: 1, col: 11 } },
				floorItems: [loot("arrival", "healing-potion", 1, 2)],
			},
			right,
		).state;
		expect(result.run.activeFloor).toBe(2);
		expect(result.activityHistory.entries[0].event).toMatchObject({
			type: "items-seen",
			items: ["healing-potion"],
			turn: 1,
		});
	});
	it("does not repeat while waiting, changing gear, dropping, or bumping a monster", () => {
		let state: GameState = resolvePlayerAction(game(), right).state;
		state = resolvePlayerAction(state, { type: "wait" }).state;
		state = resolvePlayerAction(state, {
			type: "unequip",
			slot: "offHand",
		}).state;
		state = resolvePlayerAction(state, {
			type: "drop",
			itemId: "starting:bag:1",
		}).state;
		state = resolvePlayerAction(
			{
				...state,
				monsters: [
					{
						id: "1:1",
						kind: "goblin",
						floorNumber: 1,
						coordinate: { row: 1, col: 3 },
						health: 4,
					},
				],
			},
			right,
		).state;
		expect(observations(state)).toHaveLength(1);
	});
	it("does not announce on blocked moves or empty tiles", () => {
		const before = game();
		expect(
			resolvePlayerAction(before, { type: "move", direction: "up" }).state,
		).toBe(before);
		expect(
			observations(
				resolvePlayerAction({ ...before, floorItems: [] }, right).state,
			),
		).toEqual([]);
	});
	it("announces remaining items again when leaving and returning", () => {
		const arrived = resolvePlayerAction(game(), right).state;
		const left = resolvePlayerAction(arrived, {
			type: "move",
			direction: "left",
		}).state;
		const returned = resolvePlayerAction(left, right).state;
		expect(observations(returned).map((entry) => entry.event.turn)).toEqual([
			1, 3,
		]);
	});
	it("records the observation before one monster retaliation", () => {
		const before = {
			...game(),
			monsters: [
				{
					id: "1:1",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 3 },
					health: 4,
				},
			],
		};
		const result = resolvePlayerAction(before, right).state;
		expect(result.player.health).toBe(9);
		expect(
			result.activityHistory.entries.map((entry) => entry.event.type),
		).toEqual(["items-seen", "monster-hit"]);
	});
});
