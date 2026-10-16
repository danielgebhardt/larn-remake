import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import type { GameState } from "../domain/game/GameState";
import Home from "../Home";
import { ThemeProvider } from "../settings/ThemeProvider";
import { corridorContinuationAdventure } from "./CorridorContinuationTestHelpers";
import { resetHomeTestState } from "./HomeTestHelpers";

const setup = (carryingEmber = false) => {
	const base = corridorContinuationAdventure();
	const state: GameState = {
		...base.state,
		monsters: [],
		effects: [],
		bag: {
			items: [
				{ id: "exit:1", kind: "exit-scroll" },
				{ id: "mana", kind: "mana-potion" },
				{ id: "exit:2", kind: "exit-scroll" },
			],
		},
		...(carryingEmber
			? {
					quest: { ...base.state.quest, cureRecovered: true },
					floorItems: [],
					escape: { startedTurn: 20, activatedFloors: [2] },
				}
			: {}),
	};
	render(<Home initialAdventure={{ ...base, state }} />, {
		wrapper: ThemeProvider,
	});
	return userEvent.setup();
};
afterEach(resetHomeTestState);
it("reads one scroll, closes Character to the arrival map, keeps the remaining stack position, and rejects a repeat for free", async () => {
	const user = setup();
	await user.keyboard("i");
	await user.click(
		screen.getByRole("button", {
			name: "Exit dungeon scroll, slot 1",
		}),
	);
	await user.click(screen.getByRole("button", { name: "Read exit scroll" }));
	await waitFor(() =>
		expect(
			screen.queryByRole("dialog", { name: "Character" }),
		).not.toBeInTheDocument(),
	);
	await waitFor(() =>
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus(),
	);
	expect(screen.getByText("Floor 1 of 5", { exact: true })).toBeVisible();
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 29");
	expect(screen.getByRole("log")).toHaveTextContent("read an exit scroll");
	await user.keyboard("i");
	const stack = screen.getByRole("button", {
		name: "Exit dungeon scroll, slot 1",
	});
	await user.click(stack);
	expect(
		screen.getByRole("button", { name: "Mana potion, slot 2" }),
	).toBeVisible();
	await user.click(screen.getByRole("button", { name: "Read exit scroll" }));
	expect(screen.getByRole("alert")).toHaveTextContent("already beside");
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 29");
	expect(screen.getByRole("dialog", { name: "Character" })).toBeVisible();
	expect(stack).toBeInTheDocument();
});
it("explains and disables reading while the ember is carried, including after restoration", async () => {
	const user = setup(true);
	await user.keyboard("i");
	await user.click(
		screen.getByRole("button", {
			name: "Exit dungeon scroll, slot 1",
		}),
	);
	const details = within(screen.getByRole("region", { name: "Item details" }));
	const read = details.getByRole("button", {
		name: "Read exit scroll",
	});
	expect(read).toBeDisabled();
	expect(read).toHaveAccessibleDescription(/carrying the Last Ember/);
	await user.click(read);
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 28");
	expect(
		details.queryByRole("group", { name: "Assign potion shortcut" }),
	).not.toBeInTheDocument();
});
