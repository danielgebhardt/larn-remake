// @vitest-environment node
import { describe, expect, it } from "vitest";
import { parseReviewOptions, summarizeReviews } from "../review-options.mjs";
import { createRoutes } from "../review-routing.mjs";

const defaults = { rows: 15, cols: 15, floorCount: 5 };
const limits = {
	rows: { min: 10, max: 100 },
	cols: { min: 10, max: 100 },
	floorCount: { min: 5, max: 20 },
};
const parse = (args) => parseReviewOptions(args, defaults, limits, 0xffffffff);

describe("Adventure review inputs", () => {
	it("keeps a quick default run and existing positional seeds", () => {
		expect(parse([])).toMatchObject({
			...defaults,
			seeds: [0, 1, 123, 987],
			maxActions: 500,
		});
		expect(parse(["123", "987"]).seeds).toEqual([123, 987]);
	});
	it("accepts a consecutive seed batch and large twenty-floor configuration", () => {
		expect(
			parse([
				"--seed-start",
				"20",
				"--seed-count",
				"3",
				"--rows",
				"100",
				"--cols",
				"100",
				"--floors",
				"20",
				"--max-actions",
				"10000",
				"--summary-only",
			]),
		).toMatchObject({
			seeds: [20, 21, 22],
			rows: 100,
			cols: 100,
			floorCount: 20,
			maxActions: 10000,
			summaryOnly: true,
		});
	});
	it.each([
		["--seed-count", "2"],
		["--seed-start", "0"],
		["123", "--seed-start", "0", "--seed-count", "1"],
		["--seed-start", "4294967295", "--seed-count", "2"],
		["--rows", "9"],
		["--cols", "101"],
		["--floors", "4"],
		["--floors", "21"],
		["--max-actions", "0"],
		["--rows"],
		["1.5"],
		["--unknown"],
	])("rejects invalid or ambiguous inputs: %j", (...args) =>
		expect(() => parse(args)).toThrow(),
	);
	it("keeps budget exhaustion and routing failure separate from defeat", () => {
		expect(
			summarizeReviews(
				[
					{ reason: "won", level: 3, experience: 58 },
					{ reason: "died", level: 2, experience: 12 },
					{ reason: "action limit", level: 5, experience: 110 },
					{ reason: "no route", level: 1, experience: 0 },
				],
				defaults,
				1000,
			),
		).toMatchObject({
			seeds: 4,
			outcomes: { won: 1, died: 1, "action limit": 1, "no route": 1 },
			experience: { min: 0, max: 110 },
		});
	});
});

describe("Diagnostic routes", () => {
	it("routes to a stair without accidentally walking through it to another target", () => {
		const floor = {
			terrain: ["#####", "#...#", "#####"].map((row) => [...row]),
			downStair: { coordinate: { row: 1, col: 2 } },
		};
		const route = createRoutes(floor, { row: 1, col: 1 });
		expect(route({ row: 1, col: 1 })).toEqual([]);
		expect(route({ row: 1, col: 2 })).toEqual(["right"]);
		expect(route({ row: 1, col: 3 })).toBeNull();
	});
	it("can leave an arrival stair and preserves the up/right/down/left tie order", () => {
		const floor = {
			terrain: ["#####", "#...#", "#...#", "#...#", "#####"].map((row) => [
				...row,
			]),
			upStair: { coordinate: { row: 2, col: 2 } },
		};
		expect(createRoutes(floor, { row: 2, col: 2 })({ row: 1, col: 3 })).toEqual(
			["up", "right"],
		);
	});
});
