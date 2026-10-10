import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import Home from "../Home";
import { ThemeProvider } from "../settings/ThemeProvider";
import {
	closeSettings,
	openSettings,
	readDungeonCells,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const renderWaitingRun = (monster = true) => {
	stubDungeonRun(
		createCorridorEncounter(),
		monster
			? [
					{
						id: "1:1",
						kind: "goblin",
						floorNumber: 1,
						coordinate: { row: 1, col: 3 },
						health: 4,
					},
				]
			: [],
	);
	render(<Home initialFogConfiguration={{ enabled: true, radius: 1 }} />, {
		wrapper: ThemeProvider,
	});
	return userEvent.setup();
};
afterEach(resetHomeTestState);

describe("Waiting on the play screen", () => {
	it("lets one goblin approach then hit without a player attack or movement", async () => {
		const user = renderWaitingRun();
		expect(screen.getByText("Spacebar: wait")).toBeVisible();
		await user.keyboard(" ");
		expect(screen.getByLabelText("row1col2 - goblin")).toBeVisible();
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 10 / 10",
		);
		expect(screen.getByRole("log")).toHaveTextContent("No activity yet.");
		await user.keyboard(" ");
		expect(screen.getByLabelText("row1col1 - player")).toBeVisible();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 9 / 10",
		);
		expect(screen.getByLabelText("row1col4 - undiscovered")).toBeVisible();
		expect(
			within(screen.getByRole("log"))
				.getAllByRole("listitem")
				.map((item) => item.textContent),
		).toEqual(["Turn 2 — The goblin hits you for 1 damage."]);
	});
	it("leaves Spacebar to Settings and log focus, then waits only when gameplay is focused", async () => {
		const user = renderWaitingRun(false);
		const before = readDungeonCells();
		const input = await openSettings(user);
		await user.click(input);
		await user.keyboard(" ");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		await closeSettings(user);
		// Closing the sheet restores focus to its button; Space should open it normally.
		expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
		await user.keyboard(" ");
		expect(screen.getByRole("dialog", { name: "Settings" })).toBeVisible();
		await closeSettings(user);
		screen.getByRole("log").focus();
		await user.keyboard(" ");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		screen.getByLabelText("Dungeon map", { exact: true }).focus();
		await user.keyboard(" ");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
		expect(readDungeonCells()).toEqual(before);
	});
	it("allows a fatal monster hit while waiting and ignores further Spacebar presses", async () => {
		const create = GameState.createGameState;
		vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
			...create(run),
			player: { health: 1, maxHealth: 10 },
		}));
		const user = renderWaitingRun();
		await user.keyboard("  ");
		expect(screen.getByRole("alert")).toHaveTextContent("You died.");
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 0 / 10",
		);
		const map = readDungeonCells();
		const log = screen.getByRole("log").textContent;
		await user.keyboard("  ");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
		expect(readDungeonCells()).toEqual(map);
		expect(screen.getByRole("log")).toHaveTextContent(log ?? "");
	});
});
