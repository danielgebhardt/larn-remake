import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout.tsx";
import TileIcon from "../components/dungeon/TileIcon.tsx";
import {
	type DungeonRun,
	moveDungeonRun,
} from "../domain/dungeon/DungeonRun.ts";
import { updateExploration } from "../domain/dungeon/Exploration.ts";
import { createTestDungeonFloor } from "./testhelpers.ts";

vi.mock("../components/dungeon/TileIcon.tsx", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../components/dungeon/TileIcon.tsx")>();
	return { default: vi.fn(actual.default) };
});

describe("Fog on a maximum-size map", () => {
	it("updates nearby icons without redrawing the full 10,000-tile map", () => {
		const run: DungeonRun = {
			seed: 123,
			activeFloor: 1,
			playerCoordinate: { row: 50, col: 50 },
			floors: [
				createTestDungeonFloor({
					floorNumber: 1,
					rows: 100,
					cols: 100,
					room: { startRow: 1, endRow: 98, startCol: 1, endCol: 98 },
				}),
			],
		};
		const discovery = updateExploration(run, 6);
		const props = { dungeon: run.floors[0].terrain, onMoveRequested: vi.fn() };
		const { rerender } = render(
			<DungeonLayout
				{...props}
				playerPosition={run.playerCoordinate}
				visible={discovery.visible}
				explored={discovery.explored.get(1)}
			/>,
		);
		vi.mocked(TileIcon).mockClear();
		const moved = moveDungeonRun(run, "right");
		const next = updateExploration(moved, 6, discovery);
		rerender(
			<DungeonLayout
				{...props}
				playerPosition={moved.playerCoordinate}
				visible={next.visible}
				explored={next.explored.get(1)}
			/>,
		);
		expect(vi.mocked(TileIcon).mock.calls.length).toBeGreaterThan(0);
		expect(vi.mocked(TileIcon).mock.calls.length).toBeLessThan(40);
		expect(screen.getByLabelText("row50col51 - player")).toBeVisible();
		expect(
			screen.getByLabelText("row99col99 - undiscovered").querySelector("svg"),
		).toBeNull();
		expect(moved.floors).toBe(run.floors);
	});
});
