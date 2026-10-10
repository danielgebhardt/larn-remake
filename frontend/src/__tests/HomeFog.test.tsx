import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { DungeonRun } from "../domain/dungeon/DungeonRun.ts";
import Home from "../Home.tsx";
import { ThemeProvider } from "../settings/ThemeProvider.tsx";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers.tsx";
import { createTestDungeonFloor } from "./testhelpers.ts";

const corridorRun = (): DungeonRun => ({
	seed: 123,
	activeFloor: 1,
	playerCoordinate: { row: 1, col: 1 },
	floors: [
		createTestDungeonFloor({
			floorNumber: 1,
			rows: 3,
			cols: 20,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 18 },
		}),
	],
});

afterEach(resetHomeTestState);

describe("Home fog of war", () => {
	it("starts with fog enabled and a radius of six", () => {
		stubDungeonRun(corridorRun());
		render(<Home />, { wrapper: ThemeProvider });
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row1col7 - floor" }),
		).toBeVisible();
		expect(
			screen
				.getByRole("cell", { name: "row1col8 - undiscovered" })
				.querySelector("svg"),
		).toBeNull();
	});

	it("reveals movement surroundings and remembers tiles left behind", async () => {
		stubDungeonRun(corridorRun());
		render(<Home />, { wrapper: ThemeProvider });
		await userEvent.keyboard(
			"{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}",
		);
		expect(
			screen.getByRole("cell", { name: "row1col8 - player" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row1col1 - remembered floor" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row1col14 - floor" }),
		).toBeVisible();
	});
});
