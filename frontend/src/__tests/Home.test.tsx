import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import Home from "../Home.tsx";
import * as LayoutTiles from "../LayoutTiles.ts";

afterEach(() => {
	vi.restoreAllMocks();
});

describe("Home tests", () => {
	it("shows the header and main element", () => {
		render(<Home />);

		expect(screen.getByRole("heading", { name: "Larn Remake" })).toBeVisible();
		expect(screen.getByRole("main")).toBeVisible();
	});

	it("renders a rectangular generated dungeon on the playable page", () => {
		const generated = LayoutTiles.generateDungeon({
			rows: 7,
			cols: 11,
			minPartitionSize: 5,
			roomPadding: 1,
		});
		vi.spyOn(LayoutTiles, "generateDungeon").mockReturnValue(generated);

		render(<Home />);

		const dungeon = screen.getByRole("table", { name: "Dungeon" });
		const rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(7);
		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(11);
		}
	});

	it("renders the generated terrain in the correct cells", () => {
		const generated = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 5,
			roomPadding: 1,
		});
		vi.spyOn(LayoutTiles, "generateDungeon").mockReturnValue(generated);

		render(<Home />);

		const start = LayoutTiles.selectPlayerStart(generated);

		for (const [rowIndex, row] of generated.terrain.entries()) {
			for (const [colIndex, tile] of row.entries()) {
				if (rowIndex === start.row && colIndex === start.col) {
					continue;
				}

				expect(
					screen.getByRole("cell", {
						name: `row${rowIndex}col${colIndex}`,
					}),
				).toHaveTextContent(tile);
			}
		}
	});

	it("starts the player at the selected generated floor coordinate", () => {
		const generated = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 5,
			roomPadding: 1,
		});
		vi.spyOn(LayoutTiles, "generateDungeon").mockReturnValue(generated);

		render(<Home />);

		const start = LayoutTiles.selectPlayerStart(generated);
		expect(start).toEqual({ row: 2, col: 3 });
		expect(generated.terrain[start.row][start.col]).toBe(LayoutTiles.FLOOR);
		expect(
			screen.getByRole("cell", { name: `row${start.row}col${start.col}` }),
		).toHaveTextContent(LayoutTiles.PLAYER);
	});

	it("does not generate another dungeon on an ordinary rerender", () => {
		const generated = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 5,
			roomPadding: 1,
		});
		const generateSpy = vi
			.spyOn(LayoutTiles, "generateDungeon")
			.mockReturnValue(generated);

		const { rerender } = render(<Home />);
		const callsAfterMount = generateSpy.mock.calls.length;

		rerender(<Home />);

		expect(generateSpy).toHaveBeenCalledTimes(callsAfterMount);
	});

	it("keeps the player's position on an ordinary rerender", async () => {
		const generated = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 5,
			roomPadding: 1,
		});
		vi.spyOn(LayoutTiles, "generateDungeon").mockReturnValue(generated);

		const start = LayoutTiles.selectPlayerStart(generated);
		expect(start).toEqual({ row: 2, col: 3 });
		expect(generated.terrain[2][4]).toBe(LayoutTiles.FLOOR);

		const { rerender } = render(<Home />);

		await userEvent.keyboard("{ArrowRight}");
		expect(screen.getByRole("cell", { name: "row2col4" })).toHaveTextContent(
			LayoutTiles.PLAYER,
		);

		rerender(<Home />);

		expect(screen.getByRole("cell", { name: "row2col4" })).toHaveTextContent(
			LayoutTiles.PLAYER,
		);
	});
});
