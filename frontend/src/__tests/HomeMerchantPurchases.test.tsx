import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as CombatRandomness from "../domain/game/CombatRandomness";
import * as GameState from "../domain/game/GameState";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import Home from "./TestHome";

afterEach(resetHomeTestState);
const renderShop = (fatal = false) => {
	stubDungeonRun(createCorridorEncounter());
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
		...create(run),
		gold: 700,
		player: { health: fatal ? 1 : 10, maxHealth: 10 },
		floorItems: [],
		monsters: fatal
			? [
					{
						id: "1:1",
						kind: "goblin",
						floorNumber: 1,
						coordinate: { row: 1, col: 2 },
						health: 4,
						intent: { type: "idle" },
					},
				]
			: [],
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
	screen.getByLabelText("Dungeon map", { exact: true }).focus();
	return userEvent.setup();
};
it("numbered buying updates gold, stock and potion shortcut without closing the store", async () => {
	const user = renderShop();
	await user.keyboard("e");
	const dialog = await screen.findByRole("dialog", {
		name: "Wandering potion merchant",
	});
	await user.keyboard("1");
	expect(within(dialog).getByText("Gold 550")).toBeVisible();
	expect(within(dialog).getByText(/150 gold · 9 remaining/)).toBeVisible();
	await user.click(
		within(dialog).getByRole("button", { name: /Mana potion.*200 gold/ }),
	);
	expect(within(dialog).getByText("Gold 350")).toBeVisible();
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus(),
	);
	expect(
		screen.getByRole("button", { name: /Healing potion.*1 carried/ }),
	).toBeVisible();
});
it("closes the merchant when buying gives an adjacent enemy a fatal response", async () => {
	vi.spyOn(CombatRandomness, "createAttackRolls").mockReturnValue({
		d20: () => 20,
		damage: (min) => min,
	});
	const user = renderShop(true);
	await user.keyboard("e");
	const dialog = await screen.findByRole("dialog", {
		name: "Wandering potion merchant",
	});
	await waitFor(() =>
		expect(
			within(dialog).getByRole("heading", {
				name: "Wandering potion merchant",
			}),
		).toHaveFocus(),
	);
	await user.keyboard("1");
	await screen.findByRole("dialog", { name: "You died" });
	expect(
		screen.queryByRole("dialog", { name: "Wandering potion merchant" }),
	).not.toBeInTheDocument();
});
