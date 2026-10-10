import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import Home from "../Home";
import {
	renderHome as render,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const setup = () => {
	stubDungeonRun(createCorridorEncounter());
	render(<Home />);
	const map = screen.getByLabelText("Dungeon map", { exact: true });
	map.focus();
	return { map, user: userEvent.setup() };
};
afterEach(resetHomeTestState);
describe("Character shortcut", () => {
	it.each(["i", "I"])(
		"opens with %s for free, pauses gameplay, and restores map focus",
		async (key) => {
			const { map, user } = setup();
			await user.keyboard(key);
			expect(
				await screen.findByRole("dialog", { name: "Character" }),
			).toBeVisible();
			await user.keyboard("{ArrowRight} g");
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
			await user.keyboard("{Escape}");
			await waitFor(() =>
				expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
			);
			expect(map).toHaveFocus();
		},
	);
	it.each(["button", "shortcut"])(
		"I closes from an item button and restores the %s opener",
		async (opener) => {
			const { map, user } = setup();
			const trigger = screen.getByRole("button", { name: "Character" });
			if (opener === "button") await user.click(trigger);
			else await user.keyboard("i");
			await screen.findByRole("dialog", { name: "Character" });
			await user.click(
				screen.getByRole("button", { name: "Iron sword, slot 1" }),
			);
			fireEvent.keyDown(
				screen.getByRole("button", { name: "Iron sword, slot 1" }),
				{ key: "i", repeat: true },
			);
			expect(screen.getByRole("dialog", { name: "Character" })).toBeVisible();
			await user.keyboard("I");
			await waitFor(() =>
				expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
			);
			expect(opener === "button" ? trigger : map).toHaveFocus();
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		},
	);
	it("allows inspecting Character after death", async () => {
		const create = GameState.createGameState;
		vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
			...create(run),
			player: { health: 0, maxHealth: 10 },
		}));
		const { user } = setup();
		await user.keyboard("i");
		expect(
			await screen.findByRole("dialog", { name: "Character" }),
		).toBeVisible();
		expect(screen.getByLabelText("Character health")).toHaveTextContent(
			"Health 0 / 10",
		);
	});
	it.each([
		{ repeat: true },
		{ ctrlKey: true },
		{ metaKey: true },
		{ altKey: true },
	])("ignores repeats and modified shortcuts: %j", (modifiers) => {
		setup();
		fireEvent.keyDown(window, { key: "i", ...modifiers });
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
	it.each(["Settings", "Help"])("ignores I while %s is open", async (menu) => {
		const { user } = setup();
		await user.click(screen.getByRole("button", { name: menu }));
		await screen.findByRole("dialog");
		await user.keyboard("i");
		expect(
			screen.queryByRole("dialog", { name: "Character" }),
		).not.toBeInTheDocument();
	});
	it.each(["Character", "Activity log"])(
		"ignores I on the focused %s control",
		async (name) => {
			const { user } = setup();
			if (name === "Character") screen.getByRole("button", { name }).focus();
			else screen.getByRole("log").focus();
			await user.keyboard("i");
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		},
	);
});
