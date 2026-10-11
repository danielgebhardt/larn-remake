import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import Home from "../Home";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

afterEach(resetHomeTestState);
describe("Visible hit and miss feedback", () => {
	it.each(["hit", "miss"])(
		"shows a player %s and one retaliation without moving",
		async (outcome) => {
			const stubs = stubDungeonRun(createCorridorEncounter(), [
				{
					id: "1:1",
					kind: "goblin",
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			]);
			stubs.rolls.mockImplementation((context) => ({
				d20: () =>
					context.attackerId === "player" && outcome === "miss" ? 3 : 20,
				damage: (min, max) => (context.attackerId === "player" ? max : min),
			}));
			render(<Home initialFogConfiguration={{ enabled: false, radius: 6 }} />, {
				wrapper: ThemeProvider,
			});
			const user = userEvent.setup();
			await user.keyboard("d");
			expect(screen.getByLabelText("row1col1 - player")).toBeVisible();
			expect(screen.getByLabelText("row1col2 - goblin")).toBeVisible();
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
			expect(screen.getByRole("log").textContent).toMatch(
				outcome === "miss"
					? /You miss the goblin.*hits you for 1 damage/
					: /You hit the goblin for 3 damage.*hits you for 1 damage/,
			);
		},
	);
});
