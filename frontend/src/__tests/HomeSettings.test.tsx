import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as DungeonRun from "../domain/dungeon/DungeonRun.ts";
import Home from "../Home.tsx";
import {
	closeSettings,
	openSettings,
	readDungeonCells,
	renderHome as render,
	resetHomeTestState,
} from "./HomeTestHelpers.tsx";
import { createThreeFloorTraversalRun } from "./testhelpers.ts";

afterEach(resetHomeTestState);

describe("Home settings and appearance", () => {
	it("changes appearance with mouse and keyboard without losing exploration, seed draft, or errors", async () => {
		const run = createThreeFloorTraversalRun();
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		const user = userEvent.setup();
		render(<Home />);
		await user.keyboard("{ArrowRight}{ArrowRight}");
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();
		const board = screen.getByRole("table");
		const terrain = readDungeonCells(board);
		const input = await openSettings(user);
		await user.clear(input);
		await user.type(input, "invalid");
		await user.click(screen.getByRole("button", { name: "Start from seed" }));
		const error = screen.getByRole("alert").textContent;
		expect(
			screen.getByRole("button", { name: "Dark", pressed: true }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Light" }));
		expect(document.documentElement).not.toHaveClass("dark");
		expect(
			screen.getByRole("button", { name: "Light", pressed: true }),
		).toHaveFocus();
		await user.keyboard("{ArrowRight} ");
		expect(
			screen.getByRole("button", { name: "Dark", pressed: true }),
		).toHaveFocus();
		expect(document.documentElement).toHaveClass("dark");
		expect(input).toHaveValue("invalid");
		expect(screen.getByRole("alert")).toHaveTextContent(error ?? "");
		expect(readDungeonCells(board)).toEqual(terrain);
		expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
			"123",
		);
		await closeSettings(user);
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();
		await openSettings(user);
		expect(
			screen.getByRole("button", { name: "Dark", pressed: true }),
		).toBeVisible();
		await closeSettings(user);
		await user.keyboard("{ArrowLeft}{ArrowLeft}");
		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();
		expect(generate).toHaveBeenCalledTimes(1);
	});

	it("opens settings from the header, focuses the seed field, and restores focus on dismissal", async () => {
		const run = createThreeFloorTraversalRun();
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		const user = userEvent.setup();
		render(<Home />);
		const trigger = within(screen.getByRole("banner")).getByRole("button", {
			name: "Settings",
		});
		expect(
			screen.queryByRole("textbox", { name: "Dungeon seed" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText("Current dungeon seed"),
		).not.toBeInTheDocument();
		await user.click(trigger);
		const panel = await screen.findByRole("dialog", { name: "Settings" });
		expect(
			within(panel).getByLabelText("Current dungeon seed"),
		).toHaveTextContent("123");
		await waitFor(() =>
			expect(
				within(panel).getByRole("textbox", { name: "Dungeon seed" }),
			).toHaveFocus(),
		);
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(trigger).toHaveFocus();
		expect(generate).toHaveBeenCalledTimes(1);
		await user.click(trigger);
		await user.click(
			within(await screen.findByRole("dialog", { name: "Settings" })).getByRole(
				"button",
				{ name: "Close" },
			),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(trigger).toHaveFocus();
		expect(generate).toHaveBeenCalledTimes(1);
	});

	it("opens settings with the keyboard without restarting or moving the player", async () => {
		const run = createThreeFloorTraversalRun();
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		const user = userEvent.setup();
		render(<Home />);
		await user.tab();
		expect(screen.getByRole("button", { name: "New Dungeon" })).toHaveFocus();
		await user.tab();
		expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
		await user.keyboard("{Enter}");
		expect(
			await screen.findByRole("dialog", { name: "Settings" }),
		).toBeVisible();
		await waitFor(() =>
			expect(
				screen.getByRole("textbox", { name: "Dungeon seed" }),
			).toHaveFocus(),
		);
		await closeSettings(user);
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
		expect(generate).toHaveBeenCalledTimes(1);
	});
});
