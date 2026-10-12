import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { restoreSave } from "../domain/saves/SaveFormat";
import { ThemeProvider } from "../settings/ThemeProvider";
import { renderEncounter } from "./HomeEncounterTestHelpers";
import { resetHomeTestState } from "./HomeTestHelpers";
import { savedAdventure } from "./SaveTestHelpers";
import Home from "./TestHome";

afterEach(resetHomeTestState);
it("opens a focused game-over summary and allows free inspection without reopening or advancing time", async () => {
	const { user } = renderEncounter(1);
	await user.keyboard("d");
	const dialog = await screen.findByRole("dialog", { name: "You died" });
	expect(within(dialog).getByLabelText("Run turns")).toHaveTextContent("1");
	expect(
		within(dialog).getByText(/goblin hits you for 1 damage/),
	).toBeVisible();
	await waitFor(() =>
		expect(
			within(dialog).getByRole("heading", { name: "You died" }),
		).toHaveFocus(),
	);
	await user.keyboard("d{Space}h");
	expect(within(dialog).getByLabelText("Run turns")).toHaveTextContent("1");
	await user.click(within(dialog).getByRole("button", { name: "Inspect run" }));
	await waitFor(() =>
		expect(screen.getByLabelText("Dungeon map", { exact: true })).toHaveFocus(),
	);
	await user.keyboard("d");
	expect(
		screen.queryByRole("dialog", { name: "You died" }),
	).not.toBeInTheDocument();
	expect(screen.getByLabelText("Player health")).toHaveTextContent("Health 0");
});
it("opens for a loaded dead run and replay starts the same seed alive", async () => {
	const restored = restoreSave(savedAdventure());
	restored.state = {
		...restored.state,
		player: { ...restored.state.player, health: 0 },
	};
	render(<Home initialAdventure={restored} />, { wrapper: ThemeProvider });
	const user = userEvent.setup();
	const dialog = await screen.findByRole("dialog", { name: "You died" });
	expect(within(dialog).getByLabelText("Run seed")).toHaveTextContent("123");
	await user.click(
		within(dialog).getByRole("button", { name: "Replay this seed" }),
	);
	await waitFor(() =>
		expect(
			screen.queryByRole("dialog", { name: "You died" }),
		).not.toBeInTheDocument(),
	);
	expect(screen.getByLabelText("Player health")).toHaveTextContent(
		"Health 10 / 10",
	);
	expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
});
