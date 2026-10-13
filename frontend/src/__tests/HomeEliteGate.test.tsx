import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import Home from "./TestHome";

afterEach(resetHomeTestState);
it("warns before opening, supports cancel and number selection, and restores map focus", async () => {
	stubDungeonRun(createCorridorEncounter());
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
		...create(run),
		monsters: [],
		floorItems: [],
		objects: [
			{
				id: "floor:1:object:elite-door:1",
				kind: "elite-door",
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
	await user.keyboard("d");
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	await user.keyboard("e");
	await screen.findByRole("dialog", { name: "Elite chamber gate" });
	expect(screen.getByText(/resists arcane/)).toBeVisible();
	await user.keyboard("{Escape}");
	await waitFor(() => expect(map).toHaveFocus());
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	await user.keyboard("e");
	await screen.findByRole("dialog", { name: "Elite chamber gate" });
	await user.keyboard("d");
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	await user.keyboard("1");
	await waitFor(() => expect(map).toHaveFocus());
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
	expect(
		screen.getByRole("cell", {
			name: "row1col2 - open skull-marked elite gate",
		}),
	).toBeVisible();
	await user.keyboard("e");
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
	expect(
		screen.getByRole("cell", {
			name: "row1col2 - closed skull-marked elite gate",
		}),
	).toBeVisible();
	await user.keyboard("e");
	await screen.findByRole("dialog", { name: "Elite chamber gate" });
	await user.click(screen.getByRole("button", { name: /Open the elite gate/ }));
	await waitFor(() => expect(map).toHaveFocus());
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 3");
});
