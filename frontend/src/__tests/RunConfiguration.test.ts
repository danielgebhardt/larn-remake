// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	configurationDraft,
	parseRunConfiguration,
} from "../settings/RunConfigurationDraft.ts";

describe("run configuration input", () => {
	it("normalizes whole numbers and accepts a rectangular, single-floor dungeon", () => {
		expect(
			parseRunConfiguration({ rows: " 010 ", cols: "100", floorCount: "1" }),
		).toEqual({
			valid: true,
			value: {
				rows: 10,
				cols: 100,
				floorCount: 1,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
			},
		});
	});
	it.each(["", "5", "9", "101", "5.5", "-5", "1e2", "Infinity", "abc"])(
		"rejects invalid rows: %s",
		(rows) => {
			const result = parseRunConfiguration({
				rows,
				cols: "30",
				floorCount: "3",
			});
			expect(result).toEqual({
				valid: false,
				errors: { rows: "Enter a whole number from 10 to 100." },
			});
		},
	);
	it.each(["", "5", "9", "101", "5.5"])(
		"rejects invalid columns: %s",
		(cols) => {
			expect(
				parseRunConfiguration({ rows: "30", cols, floorCount: "3" }),
			).toEqual({
				valid: false,
				errors: { cols: "Enter a whole number from 10 to 100." },
			});
		},
	);
	it.each(["", "0", "11", "1.5"])(
		"rejects invalid floor counts: %s",
		(floorCount) => {
			expect(
				parseRunConfiguration({ rows: "30", cols: "100", floorCount }),
			).toEqual({
				valid: false,
				errors: { floorCount: "Enter a whole number from 1 to 10." },
			});
		},
	);
	it("accepts maximum dimensions and floor count", () => {
		expect(
			parseRunConfiguration({ rows: "100", cols: "100", floorCount: "10" }),
		).toEqual({
			valid: true,
			value: {
				rows: 100,
				cols: 100,
				floorCount: 10,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
			},
		});
	});
	it("keeps internal generation settings when applying an editable draft", () => {
		const configuration = {
			rows: 30,
			cols: 100,
			floorCount: 3,
			minPartitionSize: 10,
			roomPadding: 2,
			minRoomSize: 4,
			maxRoomAspectRatio: 2,
		};
		expect(
			parseRunConfiguration(
				{ rows: "20", cols: "40", floorCount: "2" },
				configuration,
			),
		).toEqual({
			valid: true,
			value: {
				rows: 20,
				cols: 40,
				floorCount: 2,
				minPartitionSize: 10,
				roomPadding: 2,
				minRoomSize: 4,
				maxRoomAspectRatio: 2,
			},
		});
	});
	it("includes only user-editable values in the settings draft", () => {
		expect(
			configurationDraft({
				rows: 30,
				cols: 100,
				floorCount: 3,
				minPartitionSize: 10,
				roomPadding: 2,
				minRoomSize: 4,
				maxRoomAspectRatio: 2,
			}),
		).toEqual({ rows: "30", cols: "100", floorCount: "3" });
	});
	it("reports all invalid fields together", () => {
		const result = parseRunConfiguration({
			rows: "0",
			cols: "0",
			floorCount: "0",
		});
		expect(result.valid).toBe(false);
		if (!result.valid)
			expect(Object.keys(result.errors)).toEqual([
				"rows",
				"cols",
				"floorCount",
			]);
	});
});
