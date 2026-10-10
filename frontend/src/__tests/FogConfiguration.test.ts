// @vitest-environment node

import { describe, expect, it } from "vitest";
import { parseFogRadius } from "../settings/FogConfigurationDraft.ts";

describe("Fog radius input", () => {
	it.each([
		["1", 1],
		["20", 20],
		[" 006 ", 6],
	] as const)("accepts %j as radius %s", (input, radius) => {
		expect(parseFogRadius(input)).toBe(radius);
	});
	it.each(["", "0", "21", "-1", "1.5", "1e1", "0x10", "abc"])(
		"rejects invalid radius %j",
		(input) => {
			expect(parseFogRadius(input)).toBeUndefined();
		},
	);
});
