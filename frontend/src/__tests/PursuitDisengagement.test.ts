// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Monster } from "../domain/monsters/Monster";
import { advanceUnseenPursuit } from "../domain/monsters/MonsterAwareness";
import { PURSUIT_RULES } from "../domain/monsters/PursuitRules";
import { createTestDungeonFloor } from "./testhelpers";

const run = {
	seed: 123,
	activeFloor: 1,
	playerCoordinate: { row: 8, col: 8 },
	floors: [
		createTestDungeonFloor({
			floorNumber: 1,
			rows: 10,
			cols: 10,
			room: { startRow: 1, endRow: 8, startCol: 1, endCol: 8 },
		}),
	],
};
const hunter = (target = { row: 1, col: 3 }): Monster => ({
	id: "1:1",
	kind: "goblin",
	floorNumber: 1,
	coordinate: { row: 1, col: 1 },
	health: 4,
	intent: { type: "idle" },
	awareness: { type: "pursuing", target, remaining: 12, blocked: 0 },
});
describe("Bounded unseen pursuit", () => {
	it("searches for three phases after reaching the remembered tile then becomes idle", () => {
		let monster = hunter();
		monster = advanceUnseenPursuit(run, monster, [monster]);
		monster = advanceUnseenPursuit(run, monster, [monster]);
		expect(monster.coordinate).toEqual({ row: 1, col: 3 });
		expect(monster.awareness).toMatchObject({
			type: "searching",
			remaining: 3,
		});
		for (let i = 0; i < 2; i++)
			monster = advanceUnseenPursuit(run, monster, [monster]);
		expect(monster.awareness).toMatchObject({
			type: "searching",
			remaining: 1,
		});
		monster = advanceUnseenPursuit(run, monster, [monster]);
		expect(monster.awareness).toEqual({ type: "idle" });
	});
	it("abandons an unreachable remembered tile after three blocked phases", () => {
		const terrain = run.floors[0].terrain.map((row) => [...row]);
		terrain[1][2] = "#";
		terrain[2][1] = "#";
		const blockedRun = { ...run, floors: [{ ...run.floors[0], terrain }] };
		let monster = hunter();
		for (let i = 0; i < PURSUIT_RULES.blockedPhases; i++)
			monster = advanceUnseenPursuit(blockedRun, monster, [monster]);
		expect(monster.awareness).toEqual({ type: "idle" });
		expect(monster.coordinate).toEqual({ row: 1, col: 1 });
	});
	it("ends memory at its phase budget even on a long reachable route", () => {
		const monster = {
			...hunter({ row: 1, col: 8 }),
			awareness: {
				type: "pursuing" as const,
				target: { row: 1, col: 8 },
				remaining: 1,
				blocked: 0,
			},
		};
		const after = advanceUnseenPursuit(run, monster, [monster]);
		expect(after.awareness).toEqual({ type: "idle" });
		expect(after.coordinate).toEqual({ row: 1, col: 2 });
	});
	it("clears a blocked counter once movement is possible", () => {
		const monster = {
			...hunter(),
			awareness: {
				type: "pursuing" as const,
				target: { row: 1, col: 3 },
				remaining: 10,
				blocked: 2,
			},
		};
		expect(
			advanceUnseenPursuit(run, monster, [monster]).awareness,
		).toMatchObject({ blocked: 0 });
	});
});
