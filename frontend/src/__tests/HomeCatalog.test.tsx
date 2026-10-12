import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SPELL_DEFINITIONS } from "../domain/game/Spells";
import { ITEM_DEFINITIONS } from "../domain/items/Item";
import { MONSTER_DEFINITIONS } from "../domain/monsters/Monster";
import { renderHome, resetHomeTestState } from "./HomeTestHelpers";
import Home from "./TestHome";

const flags = vi.hoisted(() => ({ developerCatalog: true }));
vi.mock("../settings/FeatureFlags", () => ({ APP_FEATURES: flags }));
afterEach(() => {
	resetHomeTestState();
	flags.developerCatalog = true;
});
describe("Developer catalog", () => {
	it("shows the actual monster, spell and item catalogs without advancing the run", async () => {
		renderHome(<Home />);
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Catalog" }));
		const sheet = await screen.findByRole("dialog", {
			name: "Developer catalog",
		});
		for (const [label, definitions] of [
			["Monsters", MONSTER_DEFINITIONS],
			["Spells", SPELL_DEFINITIONS],
			["Items", ITEM_DEFINITIONS],
		] as const) {
			const region = within(sheet).getByRole("region", { name: label });
			expect(within(region).getAllByRole("listitem")).toHaveLength(
				Object.keys(definitions).length,
			);
		}
		await user.keyboard("{ArrowRight}gh ");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus();
	});
	it("filters by a stable kind and keeps previews informational", async () => {
		renderHome(<Home />);
		const user = userEvent.setup();
		await user.click(screen.getByRole("button", { name: "Catalog" }));
		const sheet = await screen.findByRole("dialog", {
			name: "Developer catalog",
		});
		await user.type(
			within(sheet).getByRole("searchbox", { name: "Filter catalog" }),
			"wyvern",
		);
		expect(within(sheet).getAllByRole("listitem")).toHaveLength(1);
		expect(
			within(sheet).getByRole("heading", { name: "wyvern" }),
		).toBeVisible();
		expect(within(sheet).getByText("Floors 12–20")).toBeVisible();
		expect(
			within(sheet).queryByRole("button", { name: /cast|equip|drink/i }),
		).not.toBeInTheDocument();
	});
	it("hides the entry point when the developer feature is disabled", () => {
		flags.developerCatalog = false;
		renderHome(<Home />);
		expect(
			screen.queryByRole("button", { name: "Catalog" }),
		).not.toBeInTheDocument();
	});
});
