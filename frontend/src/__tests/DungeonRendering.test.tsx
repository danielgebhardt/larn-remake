import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../DungeonLayout";
import { FLOOR, WALL } from "../LayoutTiles";
import TileIcon from "../TileIcon";

vi.mock("../TileIcon", async (importOriginal) => {
	const actual = await importOriginal<typeof import("../TileIcon")>();
	return { default: vi.fn(actual.default) };
});

const terrain = Array.from({ length: 4 }, () => Array<string>(6).fill(FLOOR));
const props = {
	dungeon: terrain,
	playerPosition: { row: 1, col: 1 },
	upStair: { row: 1, col: 1 },
	downStair: { row: 2, col: 1 },
	onPlayerMove: vi.fn(),
};

describe("Dungeon rendering", () => {
	it.each([
		{ row: 1, col: 2 },
		{ row: 2, col: 1 },
	])(
		"redraws only the old and new player tiles when moving to $row,$col",
		(position) => {
			const { rerender } = render(<DungeonLayout {...props} />);
			vi.mocked(TileIcon).mockClear();

			rerender(<DungeonLayout {...props} playerPosition={position} />);

			expect(TileIcon).toHaveBeenCalledTimes(2);
			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs up" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", {
					name: `row${position.row}col${position.col} - player`,
				}),
			).toBeVisible();
		},
	);

	it("does not redraw tiles for unrelated parent updates", () => {
		const { rerender } = render(<DungeonLayout {...props} />);
		vi.mocked(TileIcon).mockClear();

		rerender(
			<DungeonLayout
				{...props}
				playerPosition={{ ...props.playerPosition }}
				onPlayerMove={vi.fn()}
				movementEnabled={false}
			/>,
		);

		expect(TileIcon).not.toHaveBeenCalled();
	});

	it("updates replacement terrain and moved stairs even when the player stays put", () => {
		const { rerender } = render(<DungeonLayout {...props} />);
		const replacement = terrain.map((row) => [...row]);
		replacement[0][0] = WALL;

		rerender(
			<DungeonLayout
				{...props}
				dungeon={replacement}
				downStair={{ row: 3, col: 2 }}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row0col0 - wall" })).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row2col1 - floor" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row3col2 - stairs down" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
	});
});
