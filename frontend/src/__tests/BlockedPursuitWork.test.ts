// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Monster } from "../domain/monsters/Monster";
import { selectPursuitStep } from "../domain/monsters/MonsterPursuit";

describe("Blocked pursuit work", () => {
	it("does not scan a 100×100 floor when every tile beside the player is occupied", () => {
		let terrainReads = 0;
		const terrain = new Proxy(
			Array.from({ length: 100 }, () => Array<string>(100).fill(".")),
			{
				get(target, property, receiver) {
					if (typeof property === "string" && /^\d+$/.test(property))
						terrainReads++;
					return Reflect.get(target, property, receiver);
				},
			},
		);
		const actors: Monster[] = [
			[48, 50],
			[49, 50],
			[50, 51],
			[51, 50],
			[50, 49],
		].map(([row, col], index) => ({
			id: `1:${index + 1}`,
			kind: "goblin",
			floorNumber: 1,
			coordinate: { row, col },
			health: 4,
			intent: { type: "idle" },
		}));
		const run = {
			seed: 123,
			activeFloor: 1,
			playerCoordinate: { row: 50, col: 50 },
			floors: [
				{
					floorNumber: 1,
					terrain,
					partitions: {
						region: { startRow: 0, endRow: 99, startCol: 0, endCol: 99 },
					},
					rooms: [],
					corridors: [],
				},
			],
		};
		expect(selectPursuitStep(run, actors[0], actors)).toBeUndefined();
		// A structural bound avoids making the test depend on machine speed.
		expect(terrainReads).toBeLessThan(32);
	});
});
