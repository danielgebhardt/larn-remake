import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import Home from "./TestHome";

afterEach(resetHomeTestState);
it("E opens free Buy/Sell browsing, pauses game shortcuts, and Escape restores map focus", async () => {
	stubDungeonRun(createCorridorEncounter());
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
		...create(run),
		gold: 700,
		monsters: [],
		floorItems: [],
		bag: { items: [{ id: "bag:sword", kind: "iron-sword" }] },
		objects: [
			{
				id: "floor:1:object:merchant:1",
				kind: "merchant",
				floorNumber: 1,
				coordinate: { row: 1, col: 2 },
				activated: false,
			},
		],
	}));
	render(<Home />, { wrapper: ThemeProvider });
	const map = screen.getByLabelText("Dungeon map", { exact: true });
	map.focus();
	const user = userEvent.setup();
	await user.keyboard("e");
	const dialog = await screen.findByRole("dialog", {
		name: "Wandering potion merchant",
	});
	expect(within(dialog).getByText("Gold 700")).toBeVisible();
	expect(within(dialog).getByRole("tab", { name: "Buy" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(within(dialog).getByText(/150 gold/)).toBeVisible();
	expect(within(dialog).getAllByText(/10 remaining/)).toHaveLength(4);
	await user.keyboard("dgh ");
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	await user.keyboard("s");
	expect(within(dialog).getByRole("tab", { name: "Sell" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	expect(within(dialog).getByText("Iron sword")).toBeVisible();
	expect(within(dialog).getByText(/Unequip/)).toBeVisible();
	await user.keyboard("b");
	expect(within(dialog).getByRole("tab", { name: "Buy" })).toHaveAttribute(
		"aria-selected",
		"true",
	);
	await user.keyboard("{Escape}");
	await waitFor(() => expect(map).toHaveFocus());
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
});
