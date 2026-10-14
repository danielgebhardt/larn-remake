import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import Home from "./TestHome";

afterEach(resetHomeTestState);
it("keeps a sold placeholder and focuses Sell so another sale needs a deliberate selection", async () => {
	stubDungeonRun(createCorridorEncounter());
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
		...create(run),
		gold: 700,
		monsters: [],
		floorItems: [],
		bag: {
			items: [
				{ id: "bag:sword", kind: "iron-sword" },
				{ id: "bag:shield", kind: "wooden-shield" },
				{ id: "bag:potion", kind: "healing-potion" },
			],
		},
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
	await user.click(within(dialog).getByRole("tab", { name: "Sell" }));
	expect(
		within(dialog).queryByRole("button", { name: /Healing potion/ }),
	).not.toBeInTheDocument();
	expect(
		within(dialog).getByRole("button", {
			name: /Iron sword.*Sell for 20 gold/,
		}),
	).toHaveAccessibleDescription(/Better.*Damage 1–3 → 2–4/);
	await user.click(within(dialog).getByText("Compare Iron sword"));
	const summary = within(dialog).getByText("Compare Iron sword");
	expect(summary.closest("details")).toHaveAttribute("open");
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	const sword = within(dialog).getByRole("button", {
		name: /Iron sword.*Sell for 20 gold/,
	});
	sword.focus();
	await user.keyboard("{Enter}");
	expect(within(dialog).getByText("Gold 720")).toBeVisible();
	expect(within(dialog).getByText("Sold: Iron sword")).toBeVisible();
	await waitFor(() =>
		expect(within(dialog).getByRole("tab", { name: "Sell" })).toHaveFocus(),
	);
	await user.keyboard("{Enter}");
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
	const shield = within(dialog).getByRole("button", {
		name: /Wooden shield.*Sell for 20 gold/,
	});
	shield.focus();
	await user.keyboard("{Enter}");
	expect(within(dialog).getByText("Gold 740")).toBeVisible();
	expect(
		within(dialog).getByText("No carried equipment to sell."),
	).toBeVisible();
	await waitFor(() =>
		expect(within(dialog).getByRole("tab", { name: "Sell" })).toHaveFocus(),
	);
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
	await user.keyboard("{Escape}");
	await waitFor(() => expect(map).toHaveFocus());
});
