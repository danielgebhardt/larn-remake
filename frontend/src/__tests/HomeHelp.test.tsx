import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import Home from "../Home";
import {
	readDungeonCells,
	renderHome as render,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const renderHelpRun = () => {
	stubDungeonRun(createCorridorEncounter());
	render(<Home />);
	return userEvent.setup();
};
const openHelp = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.click(screen.getByRole("button", { name: "Help" }));
	return screen.findByRole("dialog", { name: "Help / Controls" });
};
afterEach(resetHomeTestState);

describe("Home Help menu", () => {
	it("shows Help beside Settings in the header", () => {
		renderHelpRun();
		const header = within(screen.getByRole("banner"));
		expect(header.getByRole("button", { name: "Help" })).toBeVisible();
		expect(header.getByRole("button", { name: "Settings" })).toBeVisible();
	});
	it("opens the Help and Controls sheet without opening Settings", async () => {
		const user = renderHelpRun();
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		const panel = await openHelp(user);
		expect(
			within(panel).getByRole("heading", { name: "Help / Controls" }),
		).toBeVisible();
		expect(
			screen.queryByRole("dialog", { name: "Settings" }),
		).not.toBeInTheDocument();
	});
	it("explains movement, waiting, attacking, stairs, and dismissal", async () => {
		const user = renderHelpRun();
		const help = within(await openHelp(user));
		for (const direction of ["up", "left", "down", "right"]) {
			expect(help.getByText(`Move ${direction}`)).toBeVisible();
			expect(help.getByLabelText(`Arrow ${direction}`)).toBeVisible();
		}
		for (const key of ["W", "A", "S", "D", "Space", "G", "Esc"]) {
			expect(help.getByText(key, { selector: "kbd" })).toBeVisible();
		}
		expect(help.getByText("Wait one turn")).toBeVisible();
		expect(help.getByText("Pick up an item")).toBeVisible();
		expect(help.getByText("Use potion shortcut")).toBeVisible();
		for (const key of ["1", "2", "3", "4"])
			expect(help.getByText(key, { selector: "kbd" })).toBeVisible();
		expect(
			help.getByText(/G to pick up an item on your current tile/),
		).toBeVisible();
		expect(
			help.getByText(/Stay in place while monsters take their turn/),
		).toBeVisible();
		expect(help.getByText(/Move into a monster to attack/)).toBeVisible();
		expect(
			help.getByText(/Enter a stair tile to change floors automatically/),
		).toBeVisible();
		expect(
			help.getByText(/Blocked movement does not use a turn/),
		).toBeVisible();
		expect(help.getByText("Close this sheet")).toBeVisible();
	});
	it.each(["Escape", "Close button"])(
		"dismisses with %s and restores focus without consuming a turn",
		async (method) => {
			const user = renderHelpRun();
			const trigger = screen.getByRole("button", { name: "Help" });
			const before = readDungeonCells();
			const panel = await openHelp(user);
			if (method === "Escape") await user.keyboard("{Escape}");
			else
				await user.click(within(panel).getByRole("button", { name: "Close" }));
			await waitFor(() =>
				expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
			);
			expect(trigger).toHaveFocus();
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
			expect(readDungeonCells()).toEqual(before);
		},
	);
	it("opens from the keyboard and keeps Space on the Help button from waiting", async () => {
		const user = renderHelpRun();
		await user.tab(); // New Dungeon
		await user.tab(); // Character
		await user.tab(); // Settings
		await user.tab(); // Help
		expect(screen.getByRole("button", { name: "Help" })).toHaveFocus();
		await user.keyboard("{Enter}");
		expect(
			await screen.findByRole("dialog", { name: "Help / Controls" }),
		).toBeVisible();
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		await user.keyboard(" ");
		expect(
			await screen.findByRole("dialog", { name: "Help / Controls" }),
		).toBeVisible();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
	it("suspends movement and waiting while open, then resumes both on the map", async () => {
		const user = renderHelpRun();
		const before = readDungeonCells();
		const log = screen.getByRole("log").textContent;
		await openHelp(user);
		await user.keyboard("{ArrowRight}d ");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		expect(readDungeonCells()).toEqual(before);
		expect(screen.getByRole("log").textContent).toBe(log);
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		screen.getByLabelText("Dungeon map", { exact: true }).focus();
		await user.keyboard("{ArrowRight} ");
		expect(screen.getByLabelText("row1col2 - player")).toBeVisible();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
	});
	it("keeps Settings drafts when Help is opened and closed", async () => {
		const user = renderHelpRun();
		await user.click(screen.getByRole("button", { name: "Settings" }));
		const input = await screen.findByRole("textbox", { name: "Dungeon seed" });
		await user.clear(input);
		await user.type(input, "456");
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		await openHelp(user);
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		await user.click(screen.getByRole("button", { name: "Settings" }));
		expect(
			await screen.findByRole("textbox", { name: "Dungeon seed" }),
		).toHaveValue("456");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
	it("explains map symbols and fog states in Help even when fog is disabled", async () => {
		const user = renderHelpRun();
		const help = await openHelp(user);
		const symbols = within(help).getByRole("region", { name: "Map symbols" });
		const legend = within(symbols).getByRole("list", {
			name: "Dungeon legend",
		});

		for (const [label, description] of [
			["Player", "Your current position."],
			["Stairs up", "Leads to the floor above."],
			["Stairs down", "Leads to the floor below."],
			["Visible", "Currently in sight."],
			["Remembered", "Explored before, but outside current sight."],
			["Undiscovered", "Not explored yet."],
		]) {
			expect(within(legend).getByText(label)).toBeVisible();
			expect(within(legend).getByText(description)).toBeVisible();
		}
		expect(
			within(symbols).getByText(
				"Visibility shading applies when fog of war is enabled.",
			),
		).toBeVisible();
	});
});
