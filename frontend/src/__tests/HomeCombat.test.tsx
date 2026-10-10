import { screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { renderEncounter } from "./HomeEncounterTestHelpers.tsx";
import {
	closeSettings,
	openSettings,
	resetHomeTestState,
} from "./HomeTestHelpers.tsx";

const messages = () =>
	within(screen.getByRole("log"))
		.getAllByRole("listitem")
		.map((item) => item.textContent);

afterEach(resetHomeTestState);

describe("Combat on the play screen", () => {
	it.each(["d", "{ArrowRight}"])(
		"attacks and kills through %s, showing ordered messages and the vacated tile",
		async (key) => {
			const { user, generate, spawn } = renderEncounter();
			await user.keyboard(key);
			expect(screen.getByLabelText("row1col1 - player")).toBeVisible();
			expect(screen.getByLabelText("row1col2 - goblin")).toBeVisible();
			expect(screen.getByLabelText("Player health")).toHaveTextContent(
				"Health 9 / 10",
			);
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
			expect(messages()).toEqual([
				"Turn 1 — You hit the goblin for 2 damage.",
				"Turn 1 — The goblin hits you for 1 damage.",
			]);
			await user.keyboard(key);
			expect(screen.getByLabelText("row1col2 - floor")).toBeVisible();
			expect(screen.getByLabelText("row1col1 - player")).toBeVisible();
			expect(screen.getByLabelText("Player health")).toHaveTextContent(
				"Health 9 / 10",
			);
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 2");
			expect(messages().slice(-2)).toEqual([
				"Turn 2 — You hit the goblin for 2 damage.",
				"Turn 2 — The goblin dies.",
			]);
			await user.keyboard(key);
			expect(screen.getByLabelText("row1col2 - player")).toBeVisible();
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 3");
			expect(messages()).toHaveLength(4);
			// The defeated goblin must stay removed after leaving and returning.
			await user.keyboard("sdda");
			expect(
				screen.getByRole("heading", { name: "Floor 1 of 2" }),
			).toBeVisible();
			expect(screen.queryByLabelText(/goblin/)).not.toBeInTheDocument();
			expect(messages()).toHaveLength(4);
			expect(generate).toHaveBeenCalledTimes(1);
			expect(spawn).toHaveBeenCalledTimes(1);
		},
	);

	it("retains injured health through Settings and floor travel, then kills the injured goblin", async () => {
		const { user } = renderEncounter();
		await user.keyboard("d");
		await openSettings(user);
		await user.keyboard("d{ArrowRight}");
		await closeSettings(user);
		expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 1");
		// Pass the goblin along the lower room row and descend.
		await user.keyboard("sdd");
		expect(screen.getByRole("heading", { name: "Floor 2 of 2" })).toBeVisible();
		await user.keyboard("da");
		expect(screen.getByRole("heading", { name: "Floor 1 of 2" })).toBeVisible();
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 9 / 10",
		);
		expect(messages()).toHaveLength(2);
		// Approach from the right; one remaining hit should kill it.
		await user.keyboard("wa");
		expect(screen.getByLabelText("row1col2 - floor")).toBeVisible();
		expect(screen.getByLabelText("Player health")).toHaveTextContent(
			"Health 9 / 10",
		);
		expect(messages().slice(-2)).toEqual([
			"Turn 8 — You hit the goblin for 2 damage.",
			"Turn 8 — The goblin dies.",
		]);
	});

	it.each(["new dungeon", "replay"])(
		"restores health, goblin, and log for a %s",
		async (restart) => {
			const { user } = renderEncounter();
			await user.keyboard("dd");
			if (restart === "new dungeon") {
				await user.click(screen.getByRole("button", { name: "New Dungeon" }));
			} else {
				await openSettings(user);
				await user.click(
					screen.getByRole("button", { name: "Start from seed" }),
				);
			}
			expect(screen.getByLabelText("Player health")).toHaveTextContent(
				"Health 10 / 10",
			);
			expect(screen.getByLabelText("Turn count")).toHaveTextContent("Turn 0");
			expect(screen.getByRole("log")).toHaveTextContent("No activity yet.");
			await user.keyboard("d");
			expect(screen.getByLabelText("row1col2 - goblin")).toBeVisible();
			expect(screen.getByLabelText("Player health")).toHaveTextContent(
				"Health 9 / 10",
			);
		},
	);
});
