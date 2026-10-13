// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState, type GameState } from "../domain/game/GameState";
import { damageMonster } from "../domain/game/MonsterDamage";
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
				rows: 12,
				cols: 12,
				room: { startRow: 1, endRow: 10, startCol: 1, endCol: 10 },
			}),
		],
	}),
	turn: 1,
	objects: [],
	monsters: [
		{
			id: "1:1",
			kind: "alarm-sentry",
			floorNumber: 1,
			coordinate: { row: 3, col: 3 },
			health: 8,
			intent: { type: "idle" },
		},
	],
});
describe("An interruptible one-shot sentry alarm", () => {
	it("prepares for one phase, sounds once, and stays at its post", () => {
		const before = encounter(),
			prepared = phase(before);
		expect(prepared.monsters[0].intent).toEqual({
			type: "preparing-alarm",
			target: { row: 3, col: 6 },
		});
		expect(prepared.player).toBe(before.player);
		const sounded = phase({ ...prepared, turn: 2 });
		expect(sounded.monsters[0].alarmUsed).toBe(true);
		expect(sounded.monsters[0].coordinate).toEqual(
			before.monsters[0].coordinate,
		);
		expect(sounded.activityHistory.entries.at(-1)?.event.type).toBe(
			"monster-alarm-sounded",
		);
		const again = phase({ ...sounded, turn: 3 });
		expect(again.activityHistory).toBe(sounded.activityHistory);
		expect(again.monsters[0].coordinate).toEqual(before.monsters[0].coordinate);
	});
	it("sleep or fear interrupts the warning before it sounds", () => {
		const prepared = phase(encounter());
		for (const condition of ["asleep", "afraid"] as const) {
			const controlled = applyTimedEffect(
				prepared,
				prepared.monsters[0],
				condition,
			);
			const after = phase({ ...controlled, turn: 2 });
			expect(after.monsters[0].alarmUsed).not.toBe(true);
			expect(
				after.activityHistory.entries.some(
					(entry) => entry.event.type === "monster-alarm-sounded",
				),
			).toBe(false);
		}
	});
	it("cannot finish an alarm after the source is killed", () => {
		const prepared = phase(encounter());
		const killed = damageMonster(prepared, prepared.monsters[0], 8, {
			type: "player-hit",
		});
		expect(
			phase({ ...killed, turn: 2 }).activityHistory.entries.some(
				(entry) => entry.event.type === "monster-alarm-sounded",
			),
		).toBe(false);
	});
	it("uses the fixed last-seen target when sight is lost and pauses off-floor", () => {
		const prepared = phase(encounter());
		const hidden = {
			...prepared,
			turn: 2,
			run: { ...prepared.run, playerCoordinate: { row: 10, col: 10 } },
		};
		expect(phase(hidden).activityHistory.entries.at(-1)?.event).toMatchObject({
			type: "monster-alarm-sounded",
			target: { row: 3, col: 6 },
		});
		const inactive = {
			...prepared,
			monsters: [{ ...prepared.monsters[0], floorNumber: 2 }],
		};
		expect(phase(inactive)).toBe(inactive);
	});
});
