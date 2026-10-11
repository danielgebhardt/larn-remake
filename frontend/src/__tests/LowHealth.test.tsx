import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import HealthDisplay from "../components/game/HealthDisplay";
import * as GameState from "../domain/game/GameState";
import Home from "../Home";
import {
	renderHome,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

afterEach(resetHomeTestState);

describe("Low-health feedback", () => {
	it.each([1, 5])("warns at %i HP even with a larger maximum", (health) => {
		render(
			<HealthDisplay
				player={{ health, maxHealth: 18 }}
				label="Player health"
			/>,
		);
		const output = screen.getByLabelText("Player health");
		expect(output).toHaveTextContent(`Health ${health} / 18`);
		expect(within(output).getByText("Low health")).toBeVisible();
		expect(
			within(output).getByText(String(health), { exact: true }),
		).toHaveClass("text-destructive");
	});
	it.each([0, 6, 18])(
		"does not show the living-player warning at %i HP",
		(health) => {
			render(
				<HealthDisplay
					player={{ health, maxHealth: 18 }}
					label="Player health"
				/>,
			);
			expect(screen.queryByText("Low health")).not.toBeInTheDocument();
		},
	);
	it("updates the number and warning when health grows above the threshold", () => {
		const { rerender } = render(
			<HealthDisplay
				player={{ health: 5, maxHealth: 10 }}
				label="Player health"
			/>,
		);
		rerender(
			<HealthDisplay
				player={{ health: 7, maxHealth: 12 }}
				label="Player health"
			/>,
		);
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 7 / 12",
		);
		expect(screen.queryByText("Low health")).not.toBeInTheDocument();
	});
	it("warns after damage, shares the Character treatment, and clears after a potion", async () => {
		stubDungeonRun(createCorridorEncounter());
		const create = GameState.createGameState;
		vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
			...create(run),
			player: { health: 6, maxHealth: 10 },
			bag: { items: [{ id: "potion", kind: "healing-potion" }] },
			potionHotbar: ["healing-potion", null, null, null],
			monsters: [
				{
					id: "1:1",
					kind: "goblin",
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			],
		}));
		renderHome(<Home />);
		const user = userEvent.setup();
		expect(screen.queryByText("Low health")).not.toBeInTheDocument();
		await user.keyboard("d");
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 5 / 10",
		);
		expect(screen.getByRole("region", { name: "Adventure" })).toHaveClass(
			"border-destructive/60",
		);
		await user.keyboard("dc");
		expect(screen.getByLabelText("Character health")).toHaveTextContent(
			"Low health",
		);
		await user.keyboard("c1");
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 10 / 10",
		);
		expect(screen.queryByText("Low health")).not.toBeInTheDocument();
		expect(screen.getByRole("region", { name: "Adventure" })).not.toHaveClass(
			"border-destructive/60",
		);
	});
	it("clears a low-health run when starting a new dungeon", async () => {
		stubDungeonRun(createCorridorEncounter());
		const create = GameState.createGameState;
		vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
			...create(run),
			player: { health: 5, maxHealth: 10 },
			monsters: [],
		}));
		renderHome(<Home />);
		expect(screen.getByText("Low health")).toBeVisible();
		await userEvent
			.setup()
			.click(screen.getByRole("button", { name: "New Dungeon" }));
		expect(screen.queryByText("Low health")).not.toBeInTheDocument();
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 10 / 10",
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
});
