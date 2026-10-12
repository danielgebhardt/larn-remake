import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it, vi } from "vitest";
import App from "../App";
import * as DungeonRun from "../domain/dungeon/DungeonRun";
import { serializeSave } from "../domain/saves/SaveFormat";
import { LOCAL_SAVE_KEY } from "../persistence/LocalAdventureSave";
import { resetHomeTestState } from "./HomeTestHelpers";
import { savedAdventureWithPickupAndHealing } from "./SaveTestHelpers";

afterEach(resetHomeTestState);
it("loads the saved adventure directly from the opening without generating a new run", async () => {
	const saved = savedAdventureWithPickupAndHealing();
	localStorage.setItem(LOCAL_SAVE_KEY, serializeSave(saved));
	const generate = vi.spyOn(DungeonRun, "generateDungeonRun");
	render(<App />);
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: "Save/Load" }));
	expect(screen.getByRole("button", { name: "Save adventure" })).toBeDisabled();
	expect(screen.getByRole("button", { name: "Export file" })).toBeDisabled();
	await user.click(screen.getByRole("button", { name: "Load adventure" }));
	await user.click(await screen.findByRole("button", { name: "Confirm load" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus(),
	);
	expect(generate).not.toHaveBeenCalled();
	expect(screen.getByLabelText("Turn count")).toHaveTextContent(
		`Turn ${saved.state.turn}`,
	);
	await user.keyboard("gh");
	expect(screen.getByRole("log")).toHaveTextContent(
		"You pick up Healing potion",
	);
	expect(screen.getByLabelText("Turn count")).toHaveTextContent(
		`Turn ${saved.state.turn + 2}`,
	);
});
it("returns from canceled loading to the opening and preserves the save slot", async () => {
	const text = serializeSave(savedAdventureWithPickupAndHealing());
	localStorage.setItem(LOCAL_SAVE_KEY, text);
	render(<App />);
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: "Save/Load" }));
	await user.click(screen.getByRole("button", { name: "Load adventure" }));
	await user.click(await screen.findByRole("button", { name: /^Cancel$/ }));
	await user.keyboard("{Escape}");
	await waitFor(() =>
		expect(
			screen.getByRole("dialog", { name: "A journey for the cure" }),
		).toBeVisible(),
	);
	expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBe(text);
	expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("keeps the opening intact when the local save is corrupt", async () => {
	localStorage.setItem(LOCAL_SAVE_KEY, "not json");
	render(<App />);
	await userEvent
		.setup()
		.click(screen.getByRole("button", { name: "Save/Load" }));
	expect(
		screen.getByRole("region", { name: "Adventure saves" }),
	).toHaveTextContent("not a valid adventure save");
	expect(screen.getByRole("button", { name: "Load adventure" })).toBeDisabled();
	expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
