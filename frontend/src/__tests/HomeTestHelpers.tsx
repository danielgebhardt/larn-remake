import { render as renderUI, screen, waitFor } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { type ComponentProps, cloneElement, type ReactElement } from "react";
import { expect, vi } from "vitest";
import * as DungeonRun from "../domain/dungeon/DungeonRun.ts";
import type { Coordinate, Dungeon } from "../domain/dungeon/DungeonTypes.ts";
import {
	DEFAULT_FOG_CONFIGURATION,
	DEFAULT_RUN_CONFIGURATION,
} from "../domain/dungeon/RunConfiguration.ts";
import type { FloorItem } from "../domain/items/FloorItems";
import * as ItemPlacement from "../domain/items/ItemPlacement";
import type { Monster } from "../domain/monsters/Monster.ts";
import * as MonsterPlacement from "../domain/monsters/MonsterPlacement.ts";
import type Home from "../Home.tsx";
import { ThemeProvider } from "../settings/ThemeProvider.tsx";
import { findFloorPath } from "./testhelpers.ts";

const { floorCount, ...DEFAULT_DUNGEON_CONFIG } = DEFAULT_RUN_CONFIGURATION;

export { DEFAULT_DUNGEON_CONFIG };

// These existing suites inspect the complete map. Fog-specific suites render
// Home directly to exercise its enabled default and discovery behavior.
export const renderHome = (ui: ReactElement<ComponentProps<typeof Home>>) => {
	// Legacy page scenarios exercise exploration without monster occupancy.
	vi.spyOn(MonsterPlacement, "spawnRunMonsters").mockReturnValue([]);
	vi.spyOn(ItemPlacement, "spawnRunItems").mockReturnValue([]);
	return renderUI(
		cloneElement(ui, {
			initialFogConfiguration: { ...DEFAULT_FOG_CONFIGURATION, enabled: false },
		}),
		{ wrapper: ThemeProvider },
	);
};

export const resetHomeTestState = () => {
	localStorage.clear();
	document.documentElement.classList.remove("dark");
	document.documentElement.style.removeProperty("color-scheme");
	vi.restoreAllMocks();
};

export const openSettings = async (
	user: ReturnType<typeof userEvent.setup>,
) => {
	await user.click(screen.getByRole("button", { name: "Settings" }));
	await screen.findByRole("dialog", { name: "Settings" });
	return screen.getByRole("textbox", { name: "Dungeon seed" });
};

export const waitForSettingsClosed = () =>
	waitFor(() => {
		expect(
			screen.queryByRole("dialog", { name: "Settings" }),
		).not.toBeInTheDocument();
	});

export const closeSettings = async (
	user: ReturnType<typeof userEvent.setup>,
) => {
	await user.keyboard("{Escape}");
	await waitForSettingsClosed();
};

export const editConfiguration = async (
	user: ReturnType<typeof userEvent.setup>,
	{ rows, columns, floors }: { rows: string; columns: string; floors: string },
) => {
	for (const [name, value] of [
		["Rows", rows],
		["Columns", columns],
		["Floors", floors],
	]) {
		const input = screen.getByRole("textbox", { name });
		await user.clear(input);
		await user.type(input, value);
	}
};

// Compare the displayed tile identities rather than SVG markup or CSS classes.
export const readDungeonCells = (
	board: HTMLElement = screen.getByRole("table", { name: "Dungeon" }),
) =>
	Array.from(board.querySelectorAll("tr"), (row) =>
		Array.from(row.querySelectorAll("td"), (cell) =>
			cell.getAttribute("aria-label"),
		),
	);

export const movementKeysTo = (
	terrain: Dungeon,
	start: Coordinate,
	target: Coordinate,
): string => {
	const path = findFloorPath(terrain, start, target);
	return path
		.slice(1)
		.map((coordinate, index) => {
			const previous = path[index];
			if (coordinate.row < previous.row) return "{ArrowUp}";
			if (coordinate.row > previous.row) return "{ArrowDown}";
			if (coordinate.col < previous.col) return "{ArrowLeft}";
			return "{ArrowRight}";
		})
		.join("");
};

export const stubDungeonRun = (
	run: DungeonRun.DungeonRun,
	monsters: readonly Monster[] = [],
	floorItems: readonly FloorItem[] = [],
) => ({
	items: vi.spyOn(ItemPlacement, "spawnRunItems").mockReturnValue(floorItems),
	spawn: vi
		.spyOn(MonsterPlacement, "spawnRunMonsters")
		.mockReturnValue(monsters),
	generate: vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run),
	connect: vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run),
});
