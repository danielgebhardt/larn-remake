import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { parseSave, serializeSave } from "../domain/saves/SaveFormat";
import Home from "../Home";
import { LOCAL_SAVE_KEY } from "../persistence/LocalAdventureSave";
import { ThemeProvider } from "../settings/ThemeProvider";
import {
	closeSettings,
	openSettings,
	readDungeonCells,
	resetHomeTestState,
} from "./HomeTestHelpers";
import { savedAdventure } from "./SaveTestHelpers";

const setup = () => {
	render(<Home />, { wrapper: ThemeProvider });
	screen.getByLabelText("Dungeon map", { exact: true }).focus();
	return userEvent.setup();
};
const openSave = async (user: ReturnType<typeof userEvent.setup>) => {
	await openSettings(user);
	await user.click(screen.getByRole("button", { name: "Save adventure" }));
	return screen.findByRole("dialog", { name: "Save this adventure?" });
};
const finishConfirmation = async (name: string) => {
	await waitFor(() =>
		expect(screen.queryByRole("dialog", { name })).not.toBeInTheDocument(),
	);
};
afterEach(resetHomeTestState);
describe("Confirmed local Save and Load", () => {
	it("asks even for the first save, focuses Cancel and pauses gameplay", async () => {
		const user = setup();
		const dialog = await openSave(user);
		await waitFor(() =>
			expect(
				within(dialog).getByRole("button", { name: "Cancel" }),
			).toHaveFocus(),
		);
		await user.keyboard("wz 1{ArrowRight}");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBeNull();
		await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
		await finishConfirmation("Save this adventure?");
		expect(
			screen.getByRole("button", { name: "Save adventure" }),
		).toHaveFocus();
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBeNull();
	});
	it("saves only after confirmation, then loads the exact earlier run without spending a turn", async () => {
		const user = setup();
		await user.keyboard("   ");
		const cells = readDungeonCells();
		await openSave(user);
		await user.click(screen.getByRole("button", { name: "Confirm save" }));
		await finishConfirmation("Save this adventure?");
		expect(screen.getByLabelText("Save feedback")).toHaveTextContent(
			"Adventure saved",
		);
		const text = localStorage.getItem(LOCAL_SAVE_KEY);
		if (!text) throw new Error("Confirmed save should exist");
		const saved = parseSave(text);
		if (!saved.ok) throw new Error(saved.error);
		expect(saved.value.state.turn).toBe(3);
		await closeSettings(user);
		screen.getByLabelText("Dungeon map", { exact: true }).focus();
		await user.keyboard(" ");
		await openSettings(user);
		await user.click(screen.getByRole("button", { name: "Load adventure" }));
		const dialog = await screen.findByRole("dialog", {
			name: "Load saved adventure?",
		});
		expect(dialog).toHaveTextContent("Turn 3");
		expect(dialog).toHaveTextContent("current progress will be replaced");
		await user.click(
			within(dialog).getByRole("button", { name: "Confirm load" }),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: "Settings" }),
			).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 3");
		expect(readDungeonCells()).toEqual(cells);
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBe(text);
		await waitFor(() =>
			expect(
				screen.getByLabelText("Dungeon map", { exact: true }),
			).toHaveFocus(),
		);
		await user.keyboard(" ");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 4");
	});
	it("keeps the old save when replacement is canceled with Escape", async () => {
		const old = serializeSave(savedAdventure());
		localStorage.setItem(LOCAL_SAVE_KEY, old);
		const user = setup();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		const dialog = await openSave(user);
		expect(dialog).toHaveTextContent("Replacing: Seed 123");
		await user.keyboard("{Escape}");
		await finishConfirmation("Save this adventure?");
		expect(screen.getByRole("dialog", { name: "Settings" })).toBeVisible();
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBe(old);
	});
	it("leaves current progress untouched when Load is canceled", async () => {
		const old = serializeSave(savedAdventure());
		localStorage.setItem(LOCAL_SAVE_KEY, old);
		const user = setup();
		await user.keyboard("  ");
		await openSettings(user);
		await user.click(screen.getByRole("button", { name: "Load adventure" }));
		await screen.findByRole("dialog", { name: "Load saved adventure?" });
		await user.keyboard("{Escape}");
		await finishConfirmation("Load saved adventure?");
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBe(old);
		expect(
			screen.getByRole("button", { name: "Load adventure" }),
		).toHaveFocus();
	});
	it("cannot load a missing or invalid save", async () => {
		const user = setup();
		await openSettings(user);
		expect(
			screen.getByRole("button", { name: "Load adventure" }),
		).toBeDisabled();
		await closeSettings(user);
		localStorage.setItem(LOCAL_SAVE_KEY, "corrupt");
		await openSettings(user);
		expect(
			screen.getByRole("region", { name: "Adventure saves" }),
		).toHaveTextContent("not a valid adventure save");
		expect(
			screen.getByRole("button", { name: "Load adventure" }),
		).toBeDisabled();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
	it("shows a failed write and preserves the old slot and current run", async () => {
		const old = serializeSave(savedAdventure());
		localStorage.setItem(LOCAL_SAVE_KEY, old);
		const user = setup();
		await openSave(user);
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
			throw new Error("Full");
		});
		await user.click(screen.getByRole("button", { name: "Confirm save" }));
		await finishConfirmation("Save this adventure?");
		expect(screen.getByLabelText("Save feedback")).toHaveTextContent(
			"previous save was not replaced",
		);
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBe(old);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
});
