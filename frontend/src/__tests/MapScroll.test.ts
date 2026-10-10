import { describe, expect, it } from "vitest";
import { getScrollOffset } from "../components/dungeon/MapScroll.ts";

describe("keeping a tile in view", () => {
	it.each([
		{
			name: "comfortable inside the viewport",
			start: 160,
			offset: 100,
			expected: 100,
		},
		{ name: "near the leading edge", start: 110, offset: 100, expected: 86 },
		{ name: "outside the leading edge", start: 50, offset: 100, expected: 26 },
		{ name: "near the trailing edge", start: 270, offset: 100, expected: 118 },
		{
			name: "outside the trailing edge",
			start: 400,
			offset: 100,
			expected: 248,
		},
		{ name: "at the map start", start: 0, offset: 100, expected: 0 },
		{ name: "at the map end", start: 476, offset: 100, expected: 300 },
	])("scrolls only as needed: $name", ({ start, offset, expected }) => {
		expect(
			getScrollOffset({
				offset,
				viewportSize: 200,
				contentSize: 500,
				tileStart: start,
				tileSize: 24,
				margin: 24,
			}),
		).toBe(expected);
	});
	it("does not scroll a map smaller than the viewport", () => {
		expect(
			getScrollOffset({
				offset: 0,
				viewportSize: 200,
				contentSize: 120,
				tileStart: 96,
				tileSize: 24,
				margin: 24,
			}),
		).toBe(0);
	});
	it("reduces the margin when the viewport barely fits a tile", () => {
		expect(
			getScrollOffset({
				offset: 0,
				viewportSize: 30,
				contentSize: 500,
				tileStart: 100,
				tileSize: 24,
				margin: 24,
			}),
		).toBe(97);
	});
});
