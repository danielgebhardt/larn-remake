// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import { alertNearbyMonsters } from "../domain/monsters/AlarmAlerts";
import { resolveMonsterPhaseWithHits as phase } from "./ControlledCombatTestHelpers";
import { createTestDungeonFloor } from "./testhelpers";

const encounter = (sentryFirst = true): GameState => ({
	...createGameState({
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 10, col: 10 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 12,
				cols: 12,
				room: { startRow: 1, endRow: 10, startCol: 1, endCol: 10 },
			}),
		],
	}),
	turn: 2,
	objects: [],
	monsters: [
		{
			id: sentryFirst ? "1:1" : "1:2",
			kind: "alarm-sentry",
			floorNumber: 1,
			coordinate: { row: 3, col: 3 },
			health: 8,
			intent: { type: "preparing-alarm", target: { row: 3, col: 6 } },
		},
		{
			id: sentryFirst ? "1:2" : "1:1",
			kind: "goblin",
			floorNumber: 1,
			coordinate: { row: 3, col: 7 },
			health: 4,
			intent: { type: "idle" },
		},
	],
});
describe("Nearby alarm recipients", () => {
	it("lets a not-yet-acted recipient follow the signaled last-seen tile once", () => {
		const after = phase(encounter());
		const goblin = after.monsters.find((actor) => actor.kind === "goblin");
		expect(goblin?.coordinate).toEqual({ row: 3, col: 6 });
		expect(goblin?.awareness).toMatchObject({ target: { row: 3, col: 6 } });
		expect(after.player.health).toBe(10);
	});
	it("alerts an already-acted recipient without granting another action", () => {
		const after = phase(encounter(false));
		const goblin = after.monsters.find((actor) => actor.kind === "goblin");
		expect(goblin?.coordinate).toEqual({ row: 3, col: 7 });
		expect(goblin?.awareness).toMatchObject({
			type: "pursuing",
			target: { row: 3, col: 6 },
		});
	});
	it("bounds recipients deterministically and preserves their own fresh sight", () => {
		const before = encounter(),
			source = { ...before.monsters[0], id: "1:99" };
		const distant = {
			...before.monsters[1],
			id: "1:10",
			coordinate: { row: 10, col: 1 },
		};
		const seeing = {
			...before.monsters[1],
			id: "1:11",
			coordinate: { row: 6, col: 6 },
			awareness: {
				type: "pursuing" as const,
				target: { row: 10, col: 10 },
				remaining: 12,
				blocked: 0,
			},
		};
		const recipients = Array.from({ length: 8 }, (_, i) => ({
			...before.monsters[1],
			id: `1:${i + 1}`,
			coordinate: { row: 1, col: i + 1 },
		}));
		const actors = [source, distant, seeing, ...recipients].reverse();
		const after = alertNearbyMonsters(before, source, actors, {
			row: 3,
			col: 6,
		});
		expect(
			after
				.filter(
					(actor) =>
						actor.awareness !==
						actors.find((original) => original.id === actor.id)?.awareness,
				)
				.map((actor) => actor.id)
				.sort(),
		).toEqual(["1:1", "1:2", "1:3", "1:4", "1:5", "1:6"]);
		expect(after.find((actor) => actor.id === seeing.id)).toBe(seeing);
		expect(after.find((actor) => actor.id === distant.id)).toBe(distant);
		expect(after).toHaveLength(actors.length);
	});

	it("does not broadcast through closed doors or to inactive floors", () => {
		const before = encounter();
		const blocked = {
			...before,
			objects: [
				{
					id: "floor:1:object:door:1",
					kind: "door" as const,
					floorNumber: 1,
					coordinate: { row: 3, col: 5 },
					activated: false,
				},
			],
			monsters: [
				...before.monsters,
				{ ...before.monsters[1], id: "2:1", floorNumber: 2 },
			],
		};
		const after = phase(blocked);
		expect(after.monsters[1]).toBe(blocked.monsters[1]);
		expect(after.monsters[2]).toBe(blocked.monsters[2]);
	});
});
