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
			screen.getByRole("cell", {
				name: `row${start.row}col${start.col} - player`,
			}),
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
		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toHaveTextContent(LayoutTiles.PLAYER);

		rerender(<Home />);

		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toHaveTextContent(LayoutTiles.PLAYER);
	});

	it("replaces the rendered dungeon and resets the player when New Dungeon is clicked", async () => {
		const user = userEvent.setup();
		const first = LayoutTiles.generateDungeon({
			rows: 7,
			cols: 11,
			minPartitionSize: 5,
			roomPadding: 1,
		});
		const second = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 5,
			roomPadding: 1,
		});

		const generateSpy = vi
			.spyOn(LayoutTiles, "generateDungeon")
			.mockReturnValue(first);

		render(<Home />);

		// Move away from the first dungeon's starting position.
		const firstStart = LayoutTiles.selectPlayerStart(first);
		const movedPosition = {
			row: firstStart.row,
			col: firstStart.col + 1,
		};

		// Confirm the fixture allows this move.
		expect(first.terrain[movedPosition.row][movedPosition.col]).toBe(
			LayoutTiles.FLOOR,
		);

		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: `row${movedPosition.row}col${movedPosition.col} - player`,
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		const callsBeforeClick = generateSpy.mock.calls.length;
		generateSpy.mockReturnValue(second);

		await user.click(screen.getByRole("button", { name: "New Dungeon" }));

		expect(generateSpy).toHaveBeenCalledTimes(callsBeforeClick + 1);

		const dungeon = screen.getByRole("table", { name: "Dungeon" });
		const rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(5);
		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(7);
		}

		const start = LayoutTiles.selectPlayerStart(second);

		for (const [rowIndex, row] of second.terrain.entries()) {
			for (const [colIndex, tile] of row.entries()) {
				let expected = tile;
				let expectedDescription = `row${rowIndex}col${colIndex}`;

				if (rowIndex === start.row && colIndex === start.col) {
					expected = LayoutTiles.PLAYER;
					expectedDescription = `row${rowIndex}col${colIndex} - player`;
				}

				expect(
					screen.getByRole("cell", {
						name: expectedDescription,
					}),
				).toHaveTextContent(expected);
			}
		}
	});

	it("resets the player on every new dungeon even when the seed and starting position repeat", async () => {
		const user = userEvent.setup();
		const generated = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 5,
			roomPadding: 1,
		});

		vi.spyOn(LayoutTiles, "generateDungeon").mockReturnValue(generated);
		vi.spyOn(Math, "random").mockReturnValue(0.5);

		render(<Home />);

		for (let generation = 0; generation < 2; generation++) {
			await user.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row2col4 - player" }),
			).toHaveTextContent(LayoutTiles.PLAYER);

			await user.click(screen.getByRole("button", { name: "New Dungeon" }));

			expect(
				screen.getByRole("cell", { name: "row2col3 - player" }),
			).toHaveTextContent(LayoutTiles.PLAYER);
			expect(screen.getByRole("cell", { name: "row2col4" })).toHaveTextContent(
				LayoutTiles.FLOOR,
			);
		}
	});

	it("uses the replacement terrain for movement and moves only once per keypress", async () => {
		const user = userEvent.setup();
		const first = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 5,
			roomPadding: 1,
		});
		const second = {
			...first,
			terrain: first.terrain.map((row) => [...row]),
		};

		// This cell was floor in the first dungeon.
		second.terrain[1][3] = LayoutTiles.WALL;

		const generateSpy = vi
			.spyOn(LayoutTiles, "generateDungeon")
			.mockReturnValue(first);

		render(<Home />);

		generateSpy.mockReturnValue(second);
		await user.click(screen.getByRole("button", { name: "New Dungeon" }));

		await user.keyboard("{ArrowUp}");

		expect(screen.getByRole("cell", { name: "row1col3" })).toHaveTextContent(
			LayoutTiles.WALL,
		);
		expect(
			screen.getByRole("cell", { name: "row2col3 - player" }),
		).toHaveTextContent(LayoutTiles.PLAYER);

		await user.keyboard("{ArrowRight}");

		expect(screen.getByRole("cell", { name: "row2col3" })).toHaveTextContent(
			LayoutTiles.FLOOR,
		);
		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toHaveTextContent(LayoutTiles.PLAYER);
		expect(screen.getByRole("cell", { name: "row2col5" })).toHaveTextContent(
			LayoutTiles.FLOOR,
		);
	});
});
