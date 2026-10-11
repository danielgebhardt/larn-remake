import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { serializeSave } from "../domain/saves/SaveFormat";
import Home from "../Home";
import { LOCAL_SAVE_KEY } from "../persistence/LocalAdventureSave";
import { ThemeProvider } from "../settings/ThemeProvider";
import {
	closeSettings,
	openSettings,
	resetHomeTestState,
} from "./HomeTestHelpers";
import { savedAdventure } from "./SaveTestHelpers";

const setup = () => {
	render(<Home />, { wrapper: ThemeProvider });
	return userEvent.setup();
};
afterEach(() => {
	resetHomeTestState();
	vi.unstubAllGlobals();
});
describe("Save file controls in Settings", () => {
	it("imports directly after choosing a valid file, leaving the local slot untouched", async () => {
		const previous = serializeSave(savedAdventure());
		localStorage.setItem(LOCAL_SAVE_KEY, previous);
		const user = setup();
		await openSettings(user);
		await user.upload(
			screen.getByLabelText("Import adventure file"),
			new File([previous], "save.json", { type: "application/json" }),
		);
		await waitFor(() =>
			expect(
				screen.queryByRole("dialog", { name: "Settings" }),
			).not.toBeInTheDocument(),
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 3");
		expect(
			screen.queryByRole("button", { name: "Confirm load" }),
		).not.toBeInTheDocument();
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBe(previous);
		await openSettings(user);
		expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
			"123",
		);
	});
	it("keeps the run and slot when import is invalid and lets the same file be chosen again", async () => {
		const previous = serializeSave(savedAdventure());
		localStorage.setItem(LOCAL_SAVE_KEY, previous);
		const user = setup();
		await openSettings(user);
		const input = screen.getByLabelText("Import adventure file");
		const file = new File(["broken"], "broken.json", {
			type: "application/json",
		});
		await user.upload(input, file);
		await screen.findByLabelText("Save feedback");
		expect(screen.getByLabelText("Save feedback")).toHaveTextContent(
			"not a valid",
		);
		await user.upload(input, file);
		await waitFor(() =>
			expect(screen.getByLabelText("Save feedback")).toHaveTextContent(
				"not a valid",
			),
		);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBe(previous);
	});
	it("exports without confirmation or changing the run or local slot", async () => {
		const create = vi.fn(() => "blob:export");
		vi.stubGlobal(
			"URL",
			class extends URL {
				static createObjectURL = create;
				static revokeObjectURL = vi.fn();
			},
		);
		vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
		const user = setup();
		await openSettings(user);
		await user.click(screen.getByRole("button", { name: "Export file" }));
		expect(create).toHaveBeenCalledOnce();
		expect(screen.getByLabelText("Save feedback")).toHaveTextContent(
			"download started",
		);
		expect(localStorage.getItem(LOCAL_SAVE_KEY)).toBeNull();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
		expect(
			screen.queryByRole("dialog", { name: "Save this adventure?" }),
		).not.toBeInTheDocument();
	});
	it("does not replace a newer run when an unfinished import is dismissed", async () => {
		vi.spyOn(FileReader.prototype, "readAsText").mockImplementation(() => {});
		const abort = vi.spyOn(FileReader.prototype, "abort");
		const user = setup();
		await openSettings(user);
		await user.upload(
			screen.getByLabelText("Import adventure file"),
			new File([serializeSave(savedAdventure())], "save.json", {
				type: "application/json",
			}),
		);
		expect(
			screen.getByRole("button", { name: "Reading file…" }),
		).toBeDisabled();
		await closeSettings(user);
		expect(abort).toHaveBeenCalledOnce();
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
	});
});
