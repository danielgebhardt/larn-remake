import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import { createEquipment } from "../domain/items/Equipment";
import Home from "../Home";
import {
	readDungeonCells,
	renderHome as render,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createThreeFloorTraversalRun } from "./testhelpers";

const renderCharacterRun = () => {
	stubDungeonRun(createThreeFloorTraversalRun());
	render(<Home />);
	return userEvent.setup();
};
const openCharacter = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.click(screen.getByRole("button", { name: "Character" }));
	return screen.findByRole("dialog", { name: "Character" });
};
const dismissCharacter = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(
			screen.queryByRole("dialog", { name: "Character" }),
		).not.toBeInTheDocument(),
	);
};
afterEach(resetHomeTestState);

describe("Character sheet", () => {
	it("shows current health and starting gear in named slots", async () => {
		const user = renderCharacterRun();
		const character = within(await openCharacter(user));
		expect(character.getByLabelText("Character health")).toHaveTextContent(
			"Health 10 / 10",
		);
		const weapon = within(character.getByRole("region", { name: "Main hand" }));
		expect(weapon.getByText("Short sword")).toBeVisible();
		expect(weapon.getByText(/simple, dependable blade/)).toBeVisible();
		const shield = within(character.getByRole("region", { name: "Off hand" }));
		expect(shield.getByText("Wooden shield")).toBeVisible();
		expect(shield.getByText(/small wooden shield/)).toBeVisible();
		expect(
			screen.queryByRole("dialog", { name: "Settings" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole("dialog", { name: "Help / Controls" }),
		).not.toBeInTheDocument();
	});
	it.each(["Escape", "Close button"])(
		"dismisses with %s and restores focus without changing the run",
		async (method) => {
			const user = renderCharacterRun();
			const map = readDungeonCells();
			const panel = await openCharacter(user);
			if (method === "Escape") await dismissCharacter(user);
			else {
				await user.click(within(panel).getByRole("button", { name: "Close" }));
				await waitFor(() =>
					expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
				);
			}
			expect(screen.getByRole("button", { name: "Character" })).toHaveFocus();
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
			expect(readDungeonCells()).toEqual(map);
		},
	);
	it("opens from the keyboard and keeps Space on its trigger from waiting", async () => {
		const user = renderCharacterRun();
		await user.tab(); // New Dungeon
		await user.tab(); // Character
		expect(screen.getByRole("button", { name: "Character" })).toHaveFocus();
		await user.keyboard("{Enter}");
		expect(
			await screen.findByRole("dialog", { name: "Character" }),
		).toBeVisible();
		await dismissCharacter(user);
		await user.keyboard(" ");
		expect(
			await screen.findByRole("dialog", { name: "Character" }),
		).toBeVisible();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
	it("pauses movement and waiting while open and resumes them on the map", async () => {
		const user = renderCharacterRun();
		const map = readDungeonCells();
		await openCharacter(user);
		await user.keyboard("{ArrowRight}d ");
		expect(readDungeonCells()).toEqual(map);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		await dismissCharacter(user);
		screen.getByLabelText("Dungeon map", { exact: true }).focus();
		await user.keyboard("{ArrowRight} ");
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
	});
	it("shows retained injured health and equipment after descent and ascent", async () => {
		const create = GameState.createGameState;
		vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
			...create(run),
			player: { health: 7, maxHealth: 10 },
		}));
		const user = renderCharacterRun();
		await user.keyboard("{ArrowRight}");
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();
		let character = within(await openCharacter(user));
		expect(character.getByLabelText("Character health")).toHaveTextContent(
			"Health 7 / 10",
		);
		expect(character.getByText("Short sword")).toBeVisible();
		await dismissCharacter(user);
		screen.getByLabelText("Dungeon map", { exact: true }).focus();
		await user.keyboard("{ArrowRight}{ArrowLeft}");
		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();
		character = within(await openCharacter(user));
		expect(character.getByLabelText("Character health")).toHaveTextContent(
			"Health 7 / 10",
		);
		expect(character.getByText("Wooden shield")).toBeVisible();
	});
	it.each(["New Dungeon", "Start from seed"])(
		"restores health and starting gear after %s",
		async (restart) => {
			const create = GameState.createGameState;
			vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
				...create(run),
				equipment: createEquipment(),
				player: { health: 0, maxHealth: 10 },
			}));
			const user = renderCharacterRun();
			const before = within(await openCharacter(user));
			expect(before.getByText("Main hand empty")).toBeVisible();
			expect(before.getByText("Off hand empty")).toBeVisible();
			expect(before.getByLabelText("Character health")).toHaveTextContent(
				"Health 0 / 10",
			);
			await dismissCharacter(user);
			if (restart === "Start from seed") {
				await user.click(screen.getByRole("button", { name: "Settings" }));
				await screen.findByRole("dialog", { name: "Settings" });
			}
			await user.click(screen.getByRole("button", { name: restart }));
			await waitFor(() =>
				expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
			);
			const after = within(await openCharacter(user));
			expect(after.getByLabelText("Character health")).toHaveTextContent(
				"Health 10 / 10",
			);
			expect(after.getByText("Short sword")).toBeVisible();
			expect(after.getByText("Wooden shield")).toBeVisible();
		},
	);
});
