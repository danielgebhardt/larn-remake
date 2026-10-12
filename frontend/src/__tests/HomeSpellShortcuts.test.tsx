import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";
import Home from "./TestHome";

afterEach(resetHomeTestState);
it("assigns a learned spell for free and casts with its numbered keyboard shortcut", async () => {
	const run = createCorridorEncounter();
	stubDungeonRun(
		run,
		[
			{
				id: "1:1",
				kind: "goblin",
				floorNumber: 1,
				coordinate: { row: 1, col: 5 },
				health: 4,
				intent: { type: "idle" },
			},
		],
		[
			{
				item: { id: "book", kind: "book-ember-bolt" },
				floorNumber: 1,
				coordinate: run.playerCoordinate,
			},
		],
	);
	render(<Home />, { wrapper: ThemeProvider });
	const user = userEvent.setup();
	await user.keyboard("gi");
	await user.click(screen.getByRole("tab", { name: "Spells" }));
	await user.click(
		screen.getByRole("button", { name: "Assign Ember Bolt to spell slot 4" }),
	);
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
	await user.keyboard("8 ");
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
	await user.keyboard("i8{Enter}");
	expect(screen.getByRole("log")).toHaveTextContent(
		"Your Ember Bolt hits the goblin",
	);
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
	expect(screen.getByLabelText("Player mana")).toHaveTextContent("Mana 6 / 10");
	expect(
		within(screen.getByRole("region", { name: "Spell hotbar" })).getAllByRole(
			"button",
		),
	).toHaveLength(3);
});
