import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as GameState from "../domain/game/GameState";
import { createBag } from "../domain/items/Bag";
import type { FloorItem } from "../domain/items/FloorItems";
import Home from "../Home";
import {
	renderHome as render,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const potion: FloorItem = {
	item: { id: "loot:1", kind: "healing-potion" },
	floorNumber: 1,
	coordinate: { row: 1, col: 1 },
};
const shield: FloorItem = {
	...potion,
	item: { id: "loot:2", kind: "wooden-shield" },
};
const renderPickupRun = (
	items: readonly FloorItem[] = [potion],
	overrides: Partial<GameState.GameState> = {},
) => {
	stubDungeonRun(createCorridorEncounter());
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
		...create(run),
		floorItems: items,
		...overrides,
	}));
	render(<Home />);
	screen.getByLabelText("Dungeon map", { exact: true }).focus();
	return userEvent.setup();
};
afterEach(resetHomeTestState);

describe("G pickup from gameplay", () => {
	it.each(["G key", "pickup chooser", "Character"])(
		"makes a picked-up potion immediately usable through the hotbar from %s",
		async (route) => {
			const user = renderPickupRun(
				route === "pickup chooser" ? [potion, shield] : [potion],
				{
					monsters: [],
					player: { health: 7, maxHealth: 10 },
				},
			);
			if (route === "Character") {
				await user.click(screen.getByRole("button", { name: "Character" }));
				await screen.findByRole("dialog", { name: "Character" });
				await user.click(
					screen.getByRole("button", {
						name: "Pick up Healing potion, item 1",
					}),
				);
			} else {
				await user.keyboard("g");
				if (route === "pickup chooser") {
					await screen.findByRole("dialog", { name: "Pick up items" });
					await user.click(
						screen.getByRole("button", {
							name: "Pick up Healing potion, item 1",
						}),
					);
				}
			}
			if (route !== "G key") {
				await user.keyboard("{Escape}");
				await waitFor(() =>
					expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
				);
				screen.getByLabelText("Dungeon map", { exact: true }).focus();
			}
			expect(
				screen.getByRole("button", {
					name: "Potion slot 1: Healing potion, 1 carried",
				}),
			).toBeVisible();
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
			await user.keyboard("1");
			expect(screen.getByLabelText("Player health")).toHaveTextContent(
				"Health 10 / 10",
			);
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
		},
	);
	it.each(["g", "G"])(
		"collects one item with %s and resolves one monster phase",
		async (key) => {
			const user = renderPickupRun([potion], {
				monsters: [
					{
						id: "1:1",
						kind: "goblin",
						floorNumber: 1,
						coordinate: { row: 1, col: 2 },
						health: 4,
					},
				],
			});
			await user.keyboard(key);
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
			expect(
				screen.getByRole("button", {
					name: "Potion slot 1: Healing potion, 1 carried",
				}),
			).toBeVisible();
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
			expect(screen.getByLabelText("Player health")).toHaveTextContent(
				"Health 9 / 10",
			);
			expect(screen.getByRole("log").textContent).toMatch(
				/pick up Healing potion.*hits you for 1 damage/,
			);
			expect(
				screen.getByLabelText("Dungeon map", { exact: true }),
			).toHaveFocus();
			await user.click(screen.getByRole("button", { name: "Character" }));
			expect(
				await screen.findByRole("button", { name: "Healing potion, slot 3" }),
			).toBeVisible();
		},
	);
	it("opens a chooser for current-tile items, pauses gameplay, and returns focus after cancellation", async () => {
		const user = renderPickupRun([
			potion,
			shield,
			{
				...shield,
				item: { id: "elsewhere", kind: "iron-sword" },
				coordinate: { row: 1, col: 3 },
			},
			{
				...shield,
				floorNumber: 2,
				item: { id: "other-floor", kind: "short-sword" },
			},
		]);
		await user.keyboard("g");
		const panel = within(
			await screen.findByRole("dialog", { name: "Pick up items" }),
		);
		expect(panel.getAllByRole("button", { name: /^Pick up / })).toHaveLength(2);
		await user.keyboard("{ArrowRight} g");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus();
		expect(screen.getByRole("log")).not.toHaveTextContent("pick up");
	});
	it("collects chosen copies one at a time and closes when the tile is empty", async () => {
		const user = renderPickupRun([potion, shield]);
		await user.keyboard("g");
		const panel = within(
			await screen.findByRole("dialog", { name: "Pick up items" }),
		);
		await user.click(
			panel.getByRole("button", { name: "Pick up Healing potion, item 1" }),
		);
		expect(
			panel.queryByRole("button", { name: /Healing potion/ }),
		).not.toBeInTheDocument();
		expect(
			panel.getByRole("status", { name: "Pickup activity" }),
		).toHaveTextContent("Turn 1");
		await user.click(
			panel.getByRole("button", { name: "Pick up Wooden shield, item 1" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus();
	});
	it.each(["empty tile", "full bag"])(
		"reports %s without spending a turn",
		async (scenario) => {
			const overrides =
				scenario === "full bag"
					? {
							bag: createBag(
								Array.from({ length: 20 }, (_, index) => ({
									id: `bag:${index}`,
									kind: "iron-sword",
								})),
							),
						}
					: {};
			const user = renderPickupRun(
				scenario === "empty tile" ? [] : [potion, shield],
				overrides,
			);
			await user.keyboard("g");
			expect(
				screen.getByRole("status", { name: "Action feedback" }),
			).toHaveTextContent(
				scenario === "full bag" ? /bag is full/i : /no items/i,
			);
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		},
	);
	it("keeps the chooser and item when the first pickup fills the bag", async () => {
		const user = renderPickupRun([potion, shield], {
			bag: createBag(
				Array.from({ length: 19 }, (_, index) => ({
					id: `bag:${index}`,
					kind: "iron-sword",
				})),
			),
		});
		await user.keyboard("g");
		const panel = within(
			await screen.findByRole("dialog", { name: "Pick up items" }),
		);
		await user.click(
			panel.getByRole("button", { name: "Pick up Healing potion, item 1" }),
		);
		await user.click(
			panel.getByRole("button", { name: "Pick up Wooden shield, item 1" }),
		);
		expect(panel.getByRole("alert")).toHaveTextContent(/bag is full/i);
		expect(
			panel.getByRole("status", { name: "Pickup activity" }),
		).toHaveTextContent("Turn 1");
		expect(
			panel.getByRole("button", { name: "Pick up Wooden shield, item 1" }),
		).toBeVisible();
	});
	it.each(["Character", "Settings", "Help"])(
		"ignores G while %s is open",
		async (menu) => {
			const user = renderPickupRun();
			await user.click(screen.getByRole("button", { name: menu }));
			await screen.findByRole("dialog");
			await user.keyboard("g");
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
			expect(screen.getByRole("log")).not.toHaveTextContent("pick up");
		},
	);
	it("retains a pickup after fatal retaliation and dismisses the chooser", async () => {
		const user = renderPickupRun([potion, shield], {
			player: { health: 1, maxHealth: 10 },
			monsters: [
				{
					id: "1:1",
					kind: "goblin",
					floorNumber: 1,
					coordinate: { row: 1, col: 2 },
					health: 4,
				},
			],
		});
		await user.keyboard("g");
		const panel = within(
			await screen.findByRole("dialog", { name: "Pick up items" }),
		);
		await user.click(
			panel.getByRole("button", { name: "Pick up Healing potion, item 1" }),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
		expect(screen.getByRole("log").textContent).toMatch(
			/pick up Healing potion.*hits you.*You die/,
		);
		await user.click(screen.getByRole("button", { name: "Character" }));
		expect(
			await screen.findByRole("button", { name: "Healing potion, slot 3" }),
		).toBeVisible();
		expect(
			screen.getByRole("button", { name: "Pick up Wooden shield, item 1" }),
		).toBeDisabled();
	});
	it("does not pick up after death", () => {
		renderPickupRun([potion], { player: { health: 0, maxHealth: 10 } });
		fireEvent.keyDown(window, { key: "g" });
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});
});
