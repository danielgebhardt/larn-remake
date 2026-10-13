import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import Home from "./TestHome";

afterEach(resetHomeTestState);
it("casts Frost Bolt from a slot and displays a visible remaining condition", async () => {
	stubDungeonRun(createCorridorEncounter(), [
		{
			id: "1:1",
			kind: "orc",
			floorNumber: 1,
			coordinate: { row: 1, col: 3 },
			health: 7,
			intent: { type: "idle" },
		},
	]);
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementation((run) => ({
		...create(run),
		knownSpells: ["magic-missile", "heal", "frost-bolt"],
		spellHotbar: ["magic-missile", "heal", "frost-bolt", null, null, null],
	}));
	render(<Home />, { wrapper: ThemeProvider });
	const user = userEvent.setup();
	await user.keyboard("7{ArrowRight}");
	expect(
		screen.getByRole("list", { name: "Visible monster conditions" }),
	).toHaveTextContent("orc: Slowed · 2 phases remaining");
	expect(screen.getByRole("log")).toHaveTextContent(
		"Your Frost Bolt hits the orc",
	);
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
});
