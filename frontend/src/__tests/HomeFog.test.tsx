import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { DungeonRun } from "../domain/dungeon/DungeonRun.ts";
import Home from "../Home.tsx";
import { ThemeProvider } from "../settings/ThemeProvider.tsx";
import {
	closeSettings,
	openSettings,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers.tsx";
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
	it("toggles fog without restarting and does not discover the whole map", async () => {
		const { generate } = stubDungeonRun(corridorRun());
		const user = userEvent.setup();
		render(<Home />, { wrapper: ThemeProvider });
		await openSettings(user);
		await user.click(
			screen.getByRole("checkbox", { name: "Enable fog of war" }),
		);
		await closeSettings(user);
		expect(
			screen.getByRole("cell", { name: "row1col18 - floor" }),
		).toBeVisible();
		await openSettings(user);
		await user.click(
			screen.getByRole("checkbox", { name: "Enable fog of war" }),
		);
		await closeSettings(user);
		expect(
			screen.getByRole("cell", { name: "row1col18 - undiscovered" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
		expect(generate).toHaveBeenCalledTimes(1);
	});

	it("applies radius immediately while retaining remembered tiles and the player", async () => {
		const { generate } = stubDungeonRun(corridorRun());
		const user = userEvent.setup();
		render(<Home />, { wrapper: ThemeProvider });
		await openSettings(user);
		const input = screen.getByRole("textbox", { name: "Visibility radius" });
		await user.clear(input);
		await user.type(input, "2");
		await user.click(
			screen.getByRole("button", { name: "Apply visibility radius" }),
		);
		await closeSettings(user);
		expect(
			screen.getByRole("cell", { name: "row1col7 - remembered floor" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row1col3 - floor" }),
		).toBeVisible();
		await openSettings(user);
		await user.clear(
			screen.getByRole("textbox", { name: "Visibility radius" }),
		);
		await user.type(
			screen.getByRole("textbox", { name: "Visibility radius" }),
			"10{Enter}",
		);
		await closeSettings(user);
		expect(
			screen.getByRole("cell", { name: "row1col11 - floor" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
		expect(generate).toHaveBeenCalledTimes(1);
	});

	it.each(["0", "21", "1.5", "oops"])(
		"preserves active radius and discovery after invalid input %j",
		async (value) => {
			const { generate } = stubDungeonRun(corridorRun());
			const user = userEvent.setup();
			render(<Home />, { wrapper: ThemeProvider });
			await openSettings(user);
			const input = screen.getByRole("textbox", { name: "Visibility radius" });
			await user.clear(input);
			await user.type(input, value);
			await user.click(
				screen.getByRole("button", { name: "Apply visibility radius" }),
			);
			expect(input).toHaveAttribute("aria-invalid", "true");
			expect(input).toHaveAccessibleDescription(/whole number from 1 to 20/);
			await closeSettings(user);
			expect(
				screen.getByRole("cell", { name: "row1col7 - floor" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "row1col8 - undiscovered" }),
			).toBeVisible();
			expect(generate).toHaveBeenCalledTimes(1);
		},
	);
});
