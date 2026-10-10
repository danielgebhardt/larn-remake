import { describe, expect, it } from "vitest";
import { createSeededRandom, parseSeedInput } from "../domain/dungeon/Seed.ts";

describe("Seed input", () => {
	it.each([
		{ input: "0", expected: 0 },
		{ input: "123", expected: 123 },
		{ input: "4294967295", expected: 4294967295 },
		{ input: " 00123 ", expected: 123 },
		{ input: "000", expected: 0 },
	])("parses decimal seed $input as $expected", ({ input, expected }) => {
		expect(parseSeedInput(input)).toBe(expected);
	});

	it.each([
		"",
		" ",
		"abc",
		"12x",
		"-1",
		"+1",
		"1.5",
		"1.0",
		"1e3",
		"0x10",
		"NaN",
		"Infinity",
		"4294967296",
	])("rejects invalid seed %j", (input) => {
		expect(parseSeedInput(input)).toBeUndefined();
	});
});

describe("Seed tests", () => {
	it("produces the same sequence from the same seed", () => {
		const first = createSeededRandom(123);
		const second = createSeededRandom(123);

		const firstValues = Array.from({ length: 20 }, () => first());
		const secondValues = Array.from({ length: 20 }, () => second());

		expect(firstValues).toStrictEqual(secondValues);
	});

	it("returns finite random values within [0, 1)", () => {
		const random = createSeededRandom(123);

		for (let index = 0; index < 100; index++) {
			const value = random();

			expect(Number.isFinite(value)).toBe(true);
			expect(value).toBeGreaterThanOrEqual(0);
			expect(value).toBeLessThan(1);
		}
	});

	it("produces different values as the source advances", () => {
		const random = createSeededRandom(123);
		const values = Array.from({ length: 20 }, () => random());

		expect(new Set(values).size).toBeGreaterThan(1);
	});

	it("produces different sequences for different seeds", () => {
		const first = createSeededRandom(123);
		const second = createSeededRandom(456);

		const firstValues = Array.from({ length: 20 }, () => first());
		const secondValues = Array.from({ length: 20 }, () => second());

		expect(firstValues).not.toStrictEqual(secondValues);
	});

	it("keeps separate sources independent even when calls are interleaved", () => {
		const first = createSeededRandom(123);
		const second = createSeededRandom(123);

		const expectedFirst = first();
		const expectedSecond = first();

		expect(second()).toBe(expectedFirst);

		// Advancing the first source must not advance the second.
		first();
		first();

		expect(second()).toBe(expectedSecond);
	});

	it("matches the Mulberry32 reference sequence for seed 123", () => {
		const random = createSeededRandom(123);

		const values = Array.from({ length: 5 }, () => random());

		expect(values).toStrictEqual([
			0.7872516233474016, 0.1785435655619949, 0.49531551403924823,
			0.23136196262203157, 0.375791602069512,
		]);
	});
});
