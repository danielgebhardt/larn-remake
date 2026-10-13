// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { GameState } from "../domain/game/GameState";
import { createGameState } from "../domain/game/GameState";
import { applyTimedEffect } from "../domain/game/TimedEffects";
import { resolveMonsterPhaseWithHits as phase } from "./ControlledCombatTestHelpers";
import { createTestDungeonFloor } from "./testhelpers";

const encounter = (): GameState => ({
	...createGameState({
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 3, col: 6 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 10,
				cols: 10,
				room: { startRow: 1, endRow: 8, startCol: 1, endCol: 8 },
			}),
		],
	}),
	turn: 1,
	objects: [],
	monsters: [
		{
			id: "1:1",
			kind: "horned-charger",
			floorNumber: 1,
			coordinate: { row: 3, col: 3 },
			health: 14,
			intent: { type: "idle" },
		},
	],
});
describe("A fixed telegraphed charge", () => {
	it("prepares without moving then charges once and spends its next phase recovering", () => {
		const before = encounter(),
			prepared = phase(before);
		expect(prepared.monsters[0].coordinate).toEqual({ row: 3, col: 3 });
		expect(prepared.monsters[0].intent).toEqual({
			type: "preparing-charge",
			target: { row: 3, col: 6 },
		});
		expect(prepared.player).toBe(before.player);
		const charged = phase({ ...prepared, turn: 2 });
		expect(charged.monsters[0].coordinate).toEqual({ row: 3, col: 5 });
		expect(charged.monsters[0].intent).toEqual({ type: "recovering-charge" });
		expect(charged.player.health).toBeLessThan(before.player.health);
		const recovered = phase({ ...charged, turn: 3 });
		expect(recovered.monsters[0].coordinate).toEqual(
			charged.monsters[0].coordinate,
		);
		expect(recovered.player).toBe(charged.player);
		expect(recovered.monsters[0].intent).toEqual({ type: "idle" });
	});
	it("commits to the old line after a sidestep instead of retargeting", () => {
		const prepared = phase(encounter());
		const dodged = {
			...prepared,
			turn: 2,
			run: { ...prepared.run, playerCoordinate: { row: 4, col: 6 } },
		};
		const after = phase(dodged);
		expect(after.player).toBe(dodged.player);
		expect(after.monsters[0].coordinate).toEqual({ row: 3, col: 6 });
	});
	it("cannot charge through another actor or a protected stair", () => {
		const prepared = phase(encounter());
		const blocked = {
			...prepared,
			turn: 2,
			monsters: [
				prepared.monsters[0],
				{
					...prepared.monsters[0],
					id: "1:2",
					kind: "goblin" as const,
					coordinate: { row: 3, col: 4 },
					health: 4,
					intent: { type: "idle" as const },
				},
			],
		};
		expect(phase(blocked).monsters[0].coordinate).toEqual({ row: 3, col: 3 });
		const stair = {
			...prepared,
			turn: 2,
			run: {
				...prepared.run,
				floors: [
					{
						...prepared.run.floors[0],
						downStair: {
							coordinate: { row: 3, col: 4 },
							destinationFloor: 2,
							arrivalCoordinate: { row: 1, col: 1 },
						},
					},
				],
			},
		};
		expect(phase(stair).monsters[0].coordinate).toEqual({ row: 3, col: 3 });
		expect(phase(stair).player).toBe(stair.player);
	});

	it("stops at a new closed door and can be interrupted with sleep", () => {
		const prepared = phase(encounter());
		const closed = {
			...prepared,
			turn: 2,
			objects: [
				{
					id: "floor:1:object:door:1",
					kind: "door" as const,
					floorNumber: 1,
					coordinate: { row: 3, col: 4 },
					activated: false,
				},
			],
		};
		expect(phase(closed).monsters[0].coordinate).toEqual({ row: 3, col: 3 });
		expect(phase(closed).player).toBe(closed.player);
		const asleep = applyTimedEffect(prepared, prepared.monsters[0], "asleep");
		expect(asleep.monsters[0].intent).toEqual({ type: "idle" });
		expect(phase(asleep).monsters).toBe(asleep.monsters);
	});
});
