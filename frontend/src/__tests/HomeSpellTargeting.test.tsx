import {
	fireEvent,
	render as renderUI,
	screen,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import Home from "../Home";
import { ThemeProvider } from "../settings/ThemeProvider";
import {
	renderHome,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const setup = (overrides: Partial<GameState.GameState> = {}) => {
	const run = createCorridorEncounter();
	stubDungeonRun(run);
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
		...create(run),
		monsters: [
			{
				id: "1:1",
				kind: "goblin",
				floorNumber: 1,
				coordinate: { row: 1, col: 3 },
				health: 9,
			},
			{
				id: "1:2",
				kind: "giant-rat",
				floorNumber: 1,
				coordinate: { row: 1, col: 5 },
				health: 9,
			},
		],
		...overrides,
	}));
	renderHome(<Home />);
	const map = screen.getByLabelText("Dungeon map", { exact: true });
	map.focus();
	return { map, user: userEvent.setup() };
};
afterEach(resetHomeTestState);
describe("Spell targeting controls", () => {
	it("shows known spells and mana, previews nearest target and cycles without moving", async () => {
		const { user } = setup();
		expect(screen.getByLabelText("Player mana")).toHaveTextContent(
			"Mana 10 / 10",
		);
		expect(
			within(screen.getByRole("region", { name: "Spell hotbar" })).getAllByRole(
				"button",
			),
		).toHaveLength(2);
		await user.keyboard("z");
		expect(
			screen.getByRole("button", { name: "Target goblin at row 1, column 3" }),
		).toHaveAttribute("aria-pressed", "true");
		await user.keyboard("{ArrowRight}");
		expect(
			screen.getByRole("button", {
				name: "Target giant rat at row 1, column 5",
			}),
		).toHaveAttribute("aria-pressed", "true");
		await user.keyboard("g 1w");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		await user.keyboard("{Enter}");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
		expect(screen.getByLabelText("Player mana")).toHaveTextContent(
			"Mana 7 / 10",
		);
		expect(
			screen.queryByRole("button", { name: /Target goblin/ }),
		).not.toBeInTheDocument();
	});
	it.each(["z", "{Escape}"])("cancels for free with %s", async (key) => {
		const { user, map } = setup();
		await user.click(
			screen.getByRole("button", { name: /Magic Missile.*3 mana/ }),
		);
		await user.keyboard(key);
		expect(
			screen.queryByRole("button", { name: /Target goblin/ }),
		).not.toBeInTheDocument();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		expect(map).toHaveFocus();
	});
	it("casts by clicking an eligible map target and clears on a new run", async () => {
		const { user } = setup();
		await user.keyboard("z");
		await user.click(
			screen.getByRole("button", { name: "Target goblin at row 1, column 3" }),
		);
		expect(screen.getByRole("log")).toHaveTextContent(
			"Magic Missile hits the goblin for 4 damage",
		);
		await user.keyboard("z");
		await user.click(screen.getByRole("button", { name: "New Dungeon" }));
		expect(
			screen.queryByRole("button", { name: /Target goblin/ }),
		).not.toBeInTheDocument();
		expect(screen.getByLabelText("Player mana")).toHaveTextContent(
			"Mana 10 / 10",
		);
	});
	it.each([{ mana: 2 }, { knownSpells: ["heal"] as const }, { monsters: [] }])(
		"gives a free reason when targeting is unavailable: %j",
		async (overrides) => {
			const { user } = setup(overrides);
			await user.keyboard("z");
			expect(screen.getByLabelText("Action feedback")).toHaveTextContent(
				/mana|learned|visible target/,
			);
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		},
	);
	it("allows Tab focus onto a target, then cycles and casts with keys", async () => {
		const { user } = setup();
		await user.keyboard("z");
		await user.tab();
		expect(
			screen.getByRole("button", { name: "Target goblin at row 1, column 3" }),
		).toHaveFocus();
		await user.keyboard("{ArrowRight}{Enter}");
		expect(screen.getByRole("log")).toHaveTextContent(
			"Magic Missile hits the giant rat",
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
	});

	it("never offers unseen targets when fog is enabled", async () => {
		const run = createCorridorEncounter();
		stubDungeonRun(run, [
			{
				id: "1:1",
				kind: "goblin",
				floorNumber: 1,
				coordinate: { row: 1, col: 4 },
				health: 9,
			},
		]);
		renderUI(<Home initialFogConfiguration={{ enabled: true, radius: 1 }} />, {
			wrapper: ThemeProvider,
		});
		screen.getByLabelText("Dungeon map", { exact: true }).focus();
		await userEvent.setup().keyboard("z");
		expect(screen.getByLabelText("Action feedback")).toHaveTextContent(
			"No visible target",
		);
		expect(
			screen.queryByRole("button", { name: /Target goblin/ }),
		).not.toBeInTheDocument();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});

	it("protects menu browsing, modified keys and repeated activation", async () => {
		const { user, map } = setup();
		fireEvent.keyDown(map, { key: "z", repeat: true });
		fireEvent.keyDown(map, { key: "z", ctrlKey: true });
		expect(
			screen.queryByRole("button", { name: /Target goblin/ }),
		).not.toBeInTheDocument();
		await user.click(screen.getByRole("button", { name: "Settings" }));
		await screen.findByRole("dialog");
		await user.keyboard("z{ArrowRight}{Enter}");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
});
