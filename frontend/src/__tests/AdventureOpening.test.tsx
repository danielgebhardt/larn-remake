import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import App from "../App";
import * as DungeonRun from "../domain/dungeon/DungeonRun";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

afterEach(resetHomeTestState);
it("introduces the quest before generating or playing an adventure", async () => {
	const generate = vi.spyOn(DungeonRun, "generateDungeonRun");
	render(<App />);
	const welcome = screen.getByRole("dialog", {
		name: "A journey for the cure",
	});
	expect(welcome).toHaveTextContent(/return.*cure/i);
	expect(
		within(welcome).getByRole("button", { name: "Begin Adventure" }),
	).toBeVisible();
	expect(generate).not.toHaveBeenCalled();
	expect(
		screen.queryByRole("table", { name: "Dungeon" }),
	).not.toBeInTheDocument();
	await userEvent.setup().keyboard("{Escape}g h{ArrowRight}");
	expect(generate).not.toHaveBeenCalled();
	expect(welcome).toBeVisible();
});
it("begins a randomly seeded adventure and focuses the map", async () => {
	const { generate } = stubDungeonRun(createCorridorEncounter());
	vi.spyOn(Math, "random").mockReturnValue(0.5);
	render(<App />);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Begin Adventure" }));
	expect(generate).toHaveBeenCalledWith(
		2147483648,
		expect.any(Number),
		expect.any(Object),
	);
	expect(
		screen.queryByRole("dialog", { name: "A journey for the cure" }),
	).not.toBeInTheDocument();
	expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus();
});
