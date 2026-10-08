import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as DungeonRun from "../DungeonRun.ts";
import Home from "../Home.tsx";
import * as LayoutTiles from "../LayoutTiles.ts";
import { STAIRS_DOWN, STAIRS_UP } from "../LayoutTiles.ts";
import { createTestDungeonFloor } from "./testhelpers.ts";

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
		const run = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, {
				rows: 5,
				cols: 7,
				minPartitionSize: 5,
				roomPadding: 1,
			}),
		);

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);

		render(<Home />);

		const activeFloor = run.floors[run.activeFloor - 1];

		for (const [rowIndex, row] of activeFloor.terrain.entries()) {
			for (const [colIndex, tile] of row.entries()) {
				const isPlayer =
					rowIndex === run.playerCoordinate.row &&
					colIndex === run.playerCoordinate.col;

				const isUpStair =
					activeFloor.upStair?.coordinate.row === rowIndex &&
					activeFloor.upStair.coordinate.col === colIndex;

				const isDownStair =
					activeFloor.downStair?.coordinate.row === rowIndex &&
					activeFloor.downStair.coordinate.col === colIndex;

				if (isPlayer || isUpStair || isDownStair) {
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

		const firstRun = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, {
				rows: 7,
				cols: 11,
				minPartitionSize: 5,
				roomPadding: 1,
			}),
		);

		const secondRun = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(456, 3, {
				rows: 5,
				cols: 7,
				minPartitionSize: 5,
				roomPadding: 1,
			}),
		);

		const generateSpy = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(firstRun);

		vi.spyOn(DungeonRun, "connectDungeonFloors").mockImplementation(
			(run) => run,
		);

		render(<Home />);

		const firstFloor = firstRun.floors[firstRun.activeFloor - 1];
		const firstStart = firstRun.playerCoordinate;

		const movedPosition = {
			row: firstStart.row,
			col: firstStart.col + 1,
		};

		expect(firstFloor.terrain[movedPosition.row][movedPosition.col]).toBe(
			LayoutTiles.FLOOR,
		);

		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: `row${movedPosition.row}col${movedPosition.col} - player`,
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		const callsBeforeClick = generateSpy.mock.calls.length;

		generateSpy.mockReturnValue(secondRun);

		await user.click(screen.getByRole("button", { name: "New Dungeon" }));

		expect(generateSpy).toHaveBeenCalledTimes(callsBeforeClick + 1);

		const dungeon = screen.getByRole("table", { name: "Dungeon" });
		const rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(5);

		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(7);
		}

		const secondStart = secondRun.playerCoordinate;

		expect(
			screen.getByRole("cell", {
				name: `row${secondStart.row}col${secondStart.col} - player`,
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);
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

	it("renders the active floor and its stair markers", () => {
		const run = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, {
				rows: 7,
				cols: 11,
				minPartitionSize: 5,
				roomPadding: 1,
			}),
		);

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);

		render(<Home />);

		const activeFloor = run.floors[run.activeFloor - 1];

		expect(activeFloor.downStair).toBeDefined();

		if (!activeFloor.downStair) {
			throw new Error("Expected active floor to have a down stair");
		}

		expect(
			screen.getByRole("cell", {
				name: `row${activeFloor.downStair.coordinate.row}col${activeFloor.downStair.coordinate.col} - stairs down`,
			}),
		).toHaveTextContent(LayoutTiles.STAIRS_DOWN);
	});

	it("renders only the active floor", () => {
		const run = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, {
				rows: 7,
				cols: 11,
				minPartitionSize: 5,
				roomPadding: 1,
			}),
		);

		const floor1 = run.floors[0];
		const floor2 = run.floors[1];

		// Give the two floors an obvious display difference.
		floor1.terrain[0][0] = "1";
		floor2.terrain[0][0] = "2";

		const activeRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: { row: 1, col: 1 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(activeRun);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(activeRun);

		render(<Home />);

		expect(screen.getByRole("cell", { name: "row0col0" })).toHaveTextContent(
			"2",
		);

		expect(
			screen.getByRole("cell", { name: "row0col0" }),
		).not.toHaveTextContent("1");
	});

	it("renders up and down stairs on an intermediate floor", () => {
		const run = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, {
				rows: 7,
				cols: 11,
				minPartitionSize: 5,
				roomPadding: 1,
			}),
		);

		const floor2 = run.floors[1];

		expect(floor2.upStair).toBeDefined();
		expect(floor2.downStair).toBeDefined();

		if (!floor2.upStair || !floor2.downStair) {
			throw new Error("Expected intermediate floor to have both stairs");
		}

		const activeRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: { row: 1, col: 1 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(activeRun);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(activeRun);

		render(<Home />);

		expect(
			screen.getByRole("cell", {
				name: `row${floor2.downStair.coordinate.row}col${floor2.downStair.coordinate.col} - stairs down`,
			}),
		).toHaveTextContent(STAIRS_DOWN);

		expect(
			screen.getByRole("cell", {
				name: `row${floor2.upStair.coordinate.row}col${floor2.upStair.coordinate.col} - stairs up`,
			}),
		).toHaveTextContent(STAIRS_UP);
	});

	it("descends onto the destination floor and renders that floor", async () => {
		const user = userEvent.setup();

		const floor1 = createTestDungeonFloor({
			floorNumber: 1,
			terrain: [
				[LayoutTiles.WALL, LayoutTiles.WALL, LayoutTiles.WALL],
				[LayoutTiles.WALL, LayoutTiles.FLOOR, LayoutTiles.FLOOR],
				[LayoutTiles.WALL, LayoutTiles.WALL, LayoutTiles.WALL],
			],
			downStair: {
				coordinate: { row: 1, col: 2 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});

		const floor2 = createTestDungeonFloor({
			floorNumber: 2,
			terrain: [
				[
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.FLOOR,
					LayoutTiles.FLOOR,
					LayoutTiles.FLOOR,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.FLOOR,
					LayoutTiles.FLOOR,
					LayoutTiles.FLOOR,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
				],
			],
			upStair: {
				coordinate: { row: 1, col: 1 },
				destinationFloor: 1,
				arrivalCoordinate: { row: 1, col: 2 },
			},
		});

		const run: DungeonRun.DungeonRun = {
			seed: 123,
			floors: [floor1, floor2],
			activeFloor: 1,
			playerCoordinate: { row: 1, col: 1 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);

		render(<Home />);

		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: "row1col1 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		const dungeon = screen.getByRole("table", { name: "Dungeon" });
		const rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(4);

		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(5);
		}
	});

	it("allows normal movement on the destination floor after descending", async () => {
		const user = userEvent.setup();

		const floor1 = createTestDungeonFloor({
			floorNumber: 1,
			terrain: [
				[LayoutTiles.WALL, LayoutTiles.WALL, LayoutTiles.WALL],
				[LayoutTiles.WALL, LayoutTiles.FLOOR, LayoutTiles.FLOOR],
				[LayoutTiles.WALL, LayoutTiles.WALL, LayoutTiles.WALL],
			],
			downStair: {
				coordinate: { row: 1, col: 2 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});

		const floor2 = createTestDungeonFloor({
			floorNumber: 2,
			terrain: [
				[
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.FLOOR,
					LayoutTiles.FLOOR,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
				],
			],
			upStair: {
				coordinate: { row: 1, col: 1 },
				destinationFloor: 1,
				arrivalCoordinate: { row: 1, col: 2 },
			},
		});

		const run: DungeonRun.DungeonRun = {
			seed: 123,
			floors: [floor1, floor2],
			activeFloor: 1,
			playerCoordinate: { row: 1, col: 1 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);

		render(<Home />);

		// Descend from floor 1 to floor 2.
		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: "row1col1 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		// Move normally on floor 2.
		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: "row1col2 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		expect(
			screen.getByRole("cell", {
				name: "row1col1 - stairs up",
			}),
		).toHaveTextContent(LayoutTiles.STAIRS_UP);
	});

	it("does not trigger another floor transition when arriving on the up stair", async () => {
		const user = userEvent.setup();

		const floor1 = createTestDungeonFloor({
			floorNumber: 1,
			terrain: [
				[LayoutTiles.WALL, LayoutTiles.WALL, LayoutTiles.WALL],
				[LayoutTiles.WALL, LayoutTiles.FLOOR, LayoutTiles.FLOOR],
				[LayoutTiles.WALL, LayoutTiles.WALL, LayoutTiles.WALL],
			],
			downStair: {
				coordinate: { row: 1, col: 2 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});

		const floor2 = createTestDungeonFloor({
			floorNumber: 2,
			terrain: [
				[
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.FLOOR,
					LayoutTiles.FLOOR,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
				],
			],
			upStair: {
				coordinate: { row: 1, col: 1 },
				destinationFloor: 1,
				arrivalCoordinate: { row: 1, col: 2 },
			},
		});

		const run: DungeonRun.DungeonRun = {
			seed: 123,
			floors: [floor1, floor2],
			activeFloor: 1,
			playerCoordinate: { row: 1, col: 1 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);

		render(<Home />);

		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: "row1col1 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		const dungeon = screen.getByRole("table", { name: "Dungeon" });
		expect(within(dungeon).getAllByRole("row")).toHaveLength(3);
	});

	it("only moves the player once after descending to the next floor", async () => {
		const user = userEvent.setup();

		const floor1 = createTestDungeonFloor({
			floorNumber: 1,
			terrain: [
				[LayoutTiles.WALL, LayoutTiles.WALL, LayoutTiles.WALL],
				[LayoutTiles.WALL, LayoutTiles.FLOOR, LayoutTiles.FLOOR],
				[LayoutTiles.WALL, LayoutTiles.WALL, LayoutTiles.WALL],
			],
			downStair: {
				coordinate: { row: 1, col: 2 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});

		const floor2 = createTestDungeonFloor({
			floorNumber: 2,
			terrain: [
				[
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.FLOOR,
					LayoutTiles.FLOOR,
					LayoutTiles.FLOOR,
					LayoutTiles.WALL,
				],
				[
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
					LayoutTiles.WALL,
				],
			],
			upStair: {
				coordinate: { row: 1, col: 1 },
				destinationFloor: 1,
				arrivalCoordinate: { row: 1, col: 2 },
			},
		});

		const run: DungeonRun.DungeonRun = {
			seed: 123,
			floors: [floor1, floor2],
			activeFloor: 1,
			playerCoordinate: { row: 1, col: 1 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);

		render(<Home />);

		// Descend.
		await user.keyboard("{ArrowRight}");

		// One move on floor 2 should move exactly one cell.
		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: "row1col2 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		expect(
			screen.getByRole("cell", {
				name: "row1col3",
			}),
		).toHaveTextContent(LayoutTiles.FLOOR);
	});
});
