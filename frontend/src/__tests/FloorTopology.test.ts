// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	countFloorBottlenecks,
	floorDistances,
} from "../domain/dungeon/FloorTopology";

const terrain = (rows: string[]) => rows.map((row) => [...row]);
describe("Walkable topology diagnostics", () => {
	it("counts actual single-tile bottlenecks in a hallway", () => {
		expect(
			countFloorBottlenecks(terrain(["#######", "#.....#", "#######"])),
		).toBe(3);
	});
	it("finds no bottlenecks in a loop and excludes walls", () => {
		expect(
			countFloorBottlenecks(
				terrain(["#####", "#...#", "#.#.#", "#...#", "#####"]),
			),
		).toBe(0);
	});
	it("measures legal orthogonal travel and marks unreachable tiles", () => {
		const map = terrain(["#######", "#..#..#", "#.....#", "#######"]);
		const distances = floorDistances(map, { row: 1, col: 1 });
		expect(distances[1 * 7 + 5]).toBe(6);
		expect(distances[0]).toBe(-1);
		expect(
			floorDistances(terrain(["#####", "#.#.#", "#####"]), {
				row: 1,
				col: 1,
			})[8],
		).toBe(-1);
	});
	it("counts a branching origin correctly", () => {
		expect(countFloorBottlenecks(terrain(["#..", "#.#", "#.#"]))).toBe(2);
	});
	it("handles a maximum-size open floor without recursive stack growth", () => {
		const map = Array.from({ length: 100 }, () => Array(100).fill("."));
		expect(countFloorBottlenecks(map)).toBe(0);
		expect(floorDistances(map, { row: 0, col: 0 })[9999]).toBe(198);
	});
	it("handles empty terrain or an invalid origin", () => {
		expect([...floorDistances([], { row: 0, col: 0 })]).toEqual([]);
		expect([...floorDistances(terrain(["###"]), { row: 0, col: 1 })]).toEqual([
			-1, -1, -1,
		]);
	});
});
