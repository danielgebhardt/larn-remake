import { fireEvent, screen, waitFor } from "@testing-library/react";
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

const setup = (kind: "chest" | "fountain" = "chest") => {
	stubDungeonRun(createCorridorEncounter());
	const create = GameState.createGameState;
	vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
		...create(run),
		monsters: [],
		player: { health: 5, maxHealth: 10 },
		floorItems: [],
		objects: [
			{
				id: "chest",
				kind,
				floorNumber: 1,
				coordinate: run.playerCoordinate,
				activated: false,
			},
			{
				id: "door",
				kind: "door",
				floorNumber: 1,
				coordinate: { row: 1, col: 2 },
				activated: true,
			},
		],
	}));
	renderHome(<Home />);
	screen.getByLabelText("Dungeon map", { exact: true }).focus();
	return userEvent.setup();
};
afterEach(resetHomeTestState);
describe("Choosing a nearby door", () => {
	it("lets the keyboard close a door beside a chest without opening the chest", async () => {
		const user = setup();
		await user.keyboard("e");
		await screen.findByRole("dialog", { name: "Interact with surroundings" });
		await user.keyboard("{ArrowRight}");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		await user.keyboard("2");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
		expect(screen.getByLabelText("row1col2 - closed door")).toBeVisible();
		expect(screen.getByRole("log")).toHaveTextContent(/close the door/i);
		expect(screen.getByRole("log")).not.toHaveTextContent(/open the chest/i);
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus();
	});
	it("moves from object selection into a fountain choice without advancing time", async () => {
		const user = setup("fountain");
		await user.keyboard("e");
		await screen.findByRole("dialog", { name: "Interact with surroundings" });
		await waitFor(() =>
			expect(
				screen.getByRole("heading", { name: "Interact with surroundings" }),
			).toHaveFocus(),
		);
		await user.keyboard("1");
		const dialog = await screen.findByRole("dialog", {
			name: "Ancient fountain",
		});
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		await waitFor(() =>
			expect(
				screen.getByRole("heading", { name: "Ancient fountain" }),
			).toHaveFocus(),
		);
		await user.keyboard("1");
		await waitFor(() => expect(dialog).not.toBeInTheDocument());
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 8 / 10",
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
	});
	it("cancels selection without consuming a turn and ignores repeated number input", async () => {
		const user = setup();
		await user.keyboard("e");
		const dialog = await screen.findByRole("dialog", {
			name: "Interact with surroundings",
		});
		fireEvent.keyDown(dialog, { key: "2", repeat: true });
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		expect(screen.getByLabelText("row1col2 - open door")).toBeVisible();
	});
});
