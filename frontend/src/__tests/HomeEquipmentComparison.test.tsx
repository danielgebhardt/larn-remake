import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import {
	renderHome,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import Home from "./TestHome";

const setup = async () => {
	stubDungeonRun(createCorridorEncounter());
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => {
		const state = create(run);
		return {
			...state,
			monsters: [],
			equipment: {
				...state.equipment,
				mainHand: { id: "equipped", kind: "iron-sword" },
			},
			bag: {
				items: [
					{ id: "weak", kind: "short-sword" },
					{ id: "equal", kind: "iron-sword" },
					{ id: "head", kind: "leather-cap" },
					{ id: "potion", kind: "healing-potion" },
				],
			},
		};
	});
	renderHome(<Home />);
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: "Character" }));
	return {
		user,
		panel: within(screen.getByRole("dialog", { name: "Character" })),
	};
};
afterEach(resetHomeTestState);
describe("Equipment comparison in Character", () => {
	it("shows color-independent comparisons and exact differences without spending turns", async () => {
		const { user, panel } = await setup();
		const lower = panel.getByRole("button", { name: "Short sword, slot 1" });
		expect(lower).toHaveAccessibleDescription(
			/Lower.*Attack bonus.*1.*equipped.*2/,
		);
		expect(
			panel.getByRole("button", { name: "Iron sword, slot 2" }),
		).toHaveAccessibleDescription(/Same/);
		expect(
			panel.getByRole("button", { name: "Leather cap, slot 3" }),
		).toHaveAccessibleDescription(/Better/);
		expect(
			panel.getByRole("button", { name: "Healing potion, slot 4" }),
		).not.toHaveAttribute("aria-describedby");
		await user.click(lower);
		expect(panel.getByLabelText("Equipment comparison")).toHaveTextContent(
			"Lower · Attack bonus 1 vs equipped 2 (−1)",
		);
		expect(lower).toHaveAttribute("aria-pressed", "true");
		expect(lower).toHaveClass("border-red-500/70");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
	it("recomputes after a swap and an empty-slot equip/unequip", async () => {
		const { user, panel } = await setup();
		await user.click(
			panel.getByRole("button", { name: "Short sword, slot 1" }),
		);
		await user.click(panel.getByRole("button", { name: "Equip in main hand" }));
		expect(
			panel.getByRole("button", { name: "Iron sword, slot 2" }),
		).toHaveAccessibleDescription(/Better/);
		await user.click(
			panel.getByRole("button", { name: "Leather cap, slot 3" }),
		);
		expect(panel.getByLabelText("Equipment comparison")).toHaveTextContent(
			"Better · Armor 1 vs equipped 0 (+1)",
		);
		await user.click(panel.getByRole("button", { name: "Equip in head" }));
		await user.click(panel.getByRole("button", { name: "Head: Leather cap" }));
		expect(
			panel.queryByLabelText("Equipment comparison"),
		).not.toBeInTheDocument();
		await user.click(panel.getByRole("button", { name: "Unequip head" }));
		expect(
			panel.getByRole("button", { name: /Leather cap, slot/ }),
		).toHaveAccessibleDescription(/Better/);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 3");
	});
	it("keeps comparisons current through drop/pickup and resets them on a fresh run", async () => {
		const { user, panel } = await setup();
		await user.click(
			panel.getByRole("button", { name: "Leather cap, slot 3" }),
		);
		await user.click(panel.getByRole("button", { name: "Drop item" }));
		expect(
			panel.queryByRole("button", { name: /Leather cap, slot/ }),
		).not.toBeInTheDocument();
		await user.click(
			panel.getByRole("button", { name: "Pick up Leather cap, item 1" }),
		);
		expect(
			panel.getByRole("button", { name: /Leather cap, slot/ }),
		).toHaveAccessibleDescription(/Better/);
		await user.keyboard("c");
		await user.click(screen.getByRole("button", { name: "New Dungeon" }));
		await user.click(screen.getByRole("button", { name: "Character" }));
		expect(
			screen.getByRole("button", { name: "Iron sword, slot 1" }),
		).toHaveAccessibleDescription(/Better/);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
});
