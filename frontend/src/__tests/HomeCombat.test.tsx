import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import type { DungeonRun } from "../domain/dungeon/DungeonRun.ts";
import type { Monster } from "../domain/monsters/Monster.ts";
import Home from "../Home.tsx";
import { ThemeProvider } from "../settings/ThemeProvider.tsx";
import {
	closeSettings,
	openSettings,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers.tsx";
import { createTestDungeonFloor } from "./testhelpers.ts";

const renderEncounter = () => {
	const run: DungeonRun = {
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 1, col: 1 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 4,
				cols: 5,
				room: { startRow: 1, endRow: 2, startCol: 1, endCol: 3 },
				downStair: {
					coordinate: { row: 2, col: 3 },
					destinationFloor: 2,
					arrivalCoordinate: { row: 1, col: 1 },
				},
			}),
			createTestDungeonFloor({
				floorNumber: 2,
				rows: 3,
				cols: 4,
				room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
				upStair: {
					coordinate: { row: 1, col: 1 },
					destinationFloor: 1,
					arrivalCoordinate: { row: 2, col: 3 },
				},
			}),
		],
	};
	const goblin: Monster = {
		id: "1:1",
		kind: "goblin",
		floorNumber: 1,
		coordinate: { row: 1, col: 2 },
		health: 4,
	};
	const stubs = stubDungeonRun(run, [goblin]);
	render(<Home initialFogConfiguration={{ enabled: true, radius: 1 }} />, {
		wrapper: ThemeProvider,
	});
	return { user: userEvent.setup(), ...stubs };
};
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
