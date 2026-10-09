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

const createThreeFloorTraversalRun = (): DungeonRun.DungeonRun => {
	const floor1 = createTestDungeonFloor({
		floorNumber: 1,
		rows: 3,
		cols: 4,
		room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
		downStair: {
			coordinate: { row: 1, col: 2 },
			destinationFloor: 2,
			arrivalCoordinate: { row: 1, col: 1 },
		},
	});

	const floor2 = createTestDungeonFloor({
		floorNumber: 2,
		rows: 3,
		cols: 5,
		room: { startRow: 1, endRow: 1, startCol: 1, endCol: 3 },
		upStair: {
			coordinate: { row: 1, col: 1 },
			destinationFloor: 1,
			arrivalCoordinate: { row: 1, col: 2 },
		},
		downStair: {
			coordinate: { row: 1, col: 3 },
			destinationFloor: 3,
			arrivalCoordinate: { row: 1, col: 1 },
		},
	});

	const floor3 = createTestDungeonFloor({
		floorNumber: 3,
		rows: 4,
		cols: 4,
		room: { startRow: 1, endRow: 2, startCol: 1, endCol: 2 },
		upStair: {
			coordinate: { row: 1, col: 1 },
			destinationFloor: 2,
			arrivalCoordinate: { row: 1, col: 3 },
		},
	});

	return {
		seed: 123,
		floors: [floor1, floor2, floor3],
		activeFloor: 1,
		playerCoordinate: { row: 1, col: 1 },
	};
};

describe("Home tests", () => {
	it("completes exploration, seed replay, and repeated whole-run restarts without restoring old floors", async () => {
		const user = userEvent.setup();
		const shiftCoordinate = (
			coordinate: LayoutTiles.Coordinate,
			offset: number,
		) => ({
			row: coordinate.row,
			col: coordinate.col + offset,
		});
		const makeRun = (seed: number, offset: number): DungeonRun.DungeonRun => {
			const original = createThreeFloorTraversalRun();
			const shiftLink = (link: DungeonRun.StairLink | undefined) =>
				link && {
					...link,
					coordinate: shiftCoordinate(link.coordinate, offset),
					arrivalCoordinate: shiftCoordinate(link.arrivalCoordinate, offset),
				};
			return {
				...original,
				seed,
				playerCoordinate: shiftCoordinate(original.playerCoordinate, offset),
				floors: original.floors.map((floor) =>
					createTestDungeonFloor({
						floorNumber: floor.floorNumber,
						rows: floor.terrain.length,
						cols: floor.terrain[0].length + offset,
						room: {
							...floor.rooms[0],
							startCol: floor.rooms[0].startCol + offset,
							endCol: floor.rooms[0].endCol + offset,
						},
						upStair: shiftLink(floor.upStair),
						downStair: shiftLink(floor.downStair),
					}),
				),
			};
		};
		const runs = new Map([
			[0, makeRun(0, 0)],
			[123, makeRun(123, 1)],
			[456, makeRun(456, 2)],
		]);
		const before = structuredClone(runs);
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockImplementation((seed) => {
				const run = runs.get(seed);
				if (!run) throw new Error(`Unexpected seed ${seed}`);
				return structuredClone(run);
			});
		const connect = vi
			.spyOn(DungeonRun, "connectDungeonFloors")
			.mockImplementation((run) => run);

		const expectFloor = (
			seed: number,
			floorNumber: number,
			player: LayoutTiles.Coordinate,
		) => {
			const floor = runs.get(seed)?.floors[floorNumber - 1];
			if (!floor) throw new Error("Expected a known fixture floor");
			const expected = floor.terrain.map((row) => [...row]);
			for (const [link, glyph] of [
				[floor.upStair, STAIRS_UP],
				[floor.downStair, STAIRS_DOWN],
			] as const) {
				if (link) expected[link.coordinate.row][link.coordinate.col] = glyph;
			}
			expected[player.row][player.col] = LayoutTiles.PLAYER;
			const table = screen.getByRole("table", { name: "Dungeon" });
			const actual = within(table)
				.getAllByRole("row")
				.map((row) =>
					within(row)
						.getAllByRole("cell")
						.map((cell) => cell.textContent),
				);
			expect(actual).toEqual(expected);
			expect(
				screen.getByRole("heading", { name: `Floor ${floorNumber} of 3` }),
			).toBeVisible();
			expect(screen.getByLabelText("Current dungeon seed").textContent).toBe(
				String(seed),
			);
		};

		const { rerender } = render(<Home />);
		expectFloor(0, 1, { row: 1, col: 1 });
		await user.keyboard("{ArrowRight}");
		expectFloor(0, 2, { row: 1, col: 1 });
		await user.keyboard("{ArrowRight}{ArrowRight}");
		expectFloor(0, 3, { row: 1, col: 1 });
		await user.keyboard("{ArrowRight}{ArrowLeft}");
		expectFloor(0, 2, { row: 1, col: 3 });
		await user.keyboard("{ArrowLeft}{ArrowLeft}");
		expectFloor(0, 1, { row: 1, col: 2 });

		const input = screen.getByRole("textbox", { name: "Dungeon seed" });
		await user.clear(input);
		await user.type(input, "0{Enter}");
		expectFloor(0, 1, { row: 1, col: 1 });
		expect(generate).toHaveBeenCalledTimes(2);
		await user.click(screen.getByRole("heading", { name: "Floor 1 of 3" }));
		await user.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
		expectFloor(0, 3, { row: 1, col: 1 });

		for (const [seed, offset] of [
			[123, 1],
			[456, 2],
		]) {
			vi.spyOn(Math, "random").mockReturnValue(seed / 4294967296);
			await user.click(screen.getByRole("button", { name: "New Dungeon" }));
			expectFloor(seed, 1, { row: 1, col: 1 + offset });
			expect(input).toHaveValue(String(seed));
			await user.keyboard("{ArrowRight}");
			expectFloor(seed, 2, { row: 1, col: 1 + offset });
			await user.keyboard("{ArrowRight}{ArrowRight}");
			expectFloor(seed, 3, { row: 1, col: 1 + offset });
			rerender(<Home />);
			expectFloor(seed, 3, { row: 1, col: 1 + offset });
		}
		await user.keyboard("{ArrowRight}{ArrowLeft}");
		expectFloor(456, 2, { row: 1, col: 5 });
		await user.keyboard("{ArrowLeft}{ArrowLeft}");
		expectFloor(456, 1, { row: 1, col: 4 });
		expect(generate.mock.calls.map(([seed]) => seed)).toEqual([0, 0, 123, 456]);
		expect(connect).toHaveBeenCalledTimes(4);
		expect(runs).toEqual(before);
	});

	describe("Seed replay", () => {
		const mockRunGeneration = () => {
			const generate = vi
				.spyOn(DungeonRun, "generateDungeonRun")
				.mockImplementation((seed) => ({
					...createThreeFloorTraversalRun(),
					seed,
				}));
			vi.spyOn(DungeonRun, "connectDungeonFloors").mockImplementation(
				(run) => run,
			);
			return generate;
		};

		it("displays the current run seed independently of the edited seed", async () => {
			const user = userEvent.setup();
			mockRunGeneration();
			render(<Home />);
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^0$/,
			);
			const input = screen.getByRole("textbox", { name: "Dungeon seed" });
			await user.clear(input);
			await user.type(input, "123");
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^0$/,
			);
		});

		it("submits an entered seed with the current generation configuration and resets depth and position", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			await user.keyboard("{ArrowRight}{ArrowRight}");
			expect(
				screen.getByRole("heading", { name: "Floor 2 of 3" }),
			).toBeVisible();
			const input = screen.getByRole("textbox", { name: "Dungeon seed" });
			await user.clear(input);
			await user.type(input, "123");
			await user.click(screen.getByRole("button", { name: "Start from seed" }));
			expect(generate).toHaveBeenCalledTimes(2);
			expect(generate).toHaveBeenLastCalledWith(123, 3, {
				rows: 30,
				cols: 100,
				minPartitionSize: 5,
				roomPadding: 1,
			});
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^123$/,
			);
			expect(
				screen.getByRole("heading", { name: "Floor 1 of 3" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toHaveTextContent(LayoutTiles.PLAYER);
		});

		it("resets repeated replays of the same seed, including submission with Enter", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			for (let replay = 0; replay < 2; replay++) {
				await user.click(screen.getByRole("heading", { name: "Floor 1 of 3" }));
				await user.keyboard("{ArrowRight}");
				expect(
					screen.getByRole("heading", { name: "Floor 2 of 3" }),
				).toBeVisible();
				const input = screen.getByRole("textbox", { name: "Dungeon seed" });
				await user.clear(input);
				await user.type(input, "0{Enter}");
				expect(
					screen.getByRole("heading", { name: "Floor 1 of 3" }),
				).toBeVisible();
				expect(
					screen.getByRole("cell", { name: "row1col1 - player" }),
				).toHaveTextContent(LayoutTiles.PLAYER);
			}
			expect(generate).toHaveBeenCalledTimes(3);
		});

		it("keeps typing and arrow keys in the seed field separate from movement and retains the run on rerender", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			const { rerender } = render(<Home />);
			const dungeon = screen.getByRole("table", { name: "Dungeon" });
			const before = dungeon.innerHTML;
			const input = screen.getByRole("textbox", { name: "Dungeon seed" });
			await user.clear(input);
			await user.type(input, "wasd");
			await user.keyboard("{ArrowLeft}{ArrowRight}{ArrowUp}{ArrowDown}");
			rerender(<Home />);
			expect(input).toHaveValue("wasd");
			expect(dungeon.innerHTML).toBe(before);
			expect(generate).toHaveBeenCalledTimes(1);
		});

		it.each(["", "abc", "-1", "1.5", "1e3", "0x10", "4294967296"])(
			"reports invalid seed %j accessibly without changing the explored run",
			async (value) => {
				const user = userEvent.setup();
				const generate = mockRunGeneration();
				render(<Home />);
				await user.keyboard("{ArrowRight}");
				const dungeon = screen.getByRole("table", { name: "Dungeon" });
				const before = dungeon.innerHTML;
				const input = screen.getByRole("textbox", { name: "Dungeon seed" });
				await user.clear(input);
				if (value) await user.type(input, value);
				await user.click(
					screen.getByRole("button", { name: "Start from seed" }),
				);
				expect(screen.getByRole("alert")).toHaveTextContent(
					"Enter a whole number from 0 to 4294967295.",
				);
				expect(input).toHaveAttribute("aria-invalid", "true");
				expect(input).toHaveAccessibleDescription(
					"Enter a whole number from 0 to 4294967295.",
				);
				expect(
					screen.getByRole("heading", { name: "Floor 2 of 3" }),
				).toBeVisible();
				expect(dungeon.innerHTML).toBe(before);
				expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
					/^0$/,
				);
				expect(generate).toHaveBeenCalledTimes(1);
			},
		);

		it("clears invalid feedback after correction and accepts a normalized seed", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			const input = screen.getByRole("textbox", { name: "Dungeon seed" });
			await user.clear(input);
			await user.type(input, "bad{Enter}");
			expect(screen.getByRole("alert")).toBeVisible();
			await user.clear(input);
			await user.type(input, " 00123 {Enter}");
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			expect(input).toHaveAttribute("aria-invalid", "false");
			expect(input).toHaveValue("123");
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^123$/,
			);
			expect(generate).toHaveBeenCalledTimes(2);
		});

		it.each([
			{ random: 0, expected: "0" },
			{ random: 0.5, expected: "2147483648" },
			{ random: 1 - Number.EPSILON, expected: "4294967295" },
		])(
			"starts a random new dungeon with seed $expected and clears invalid feedback",
			async ({ random, expected }) => {
				const user = userEvent.setup();
				mockRunGeneration();
				vi.spyOn(Math, "random").mockReturnValue(random);
				render(<Home />);
				const input = screen.getByRole("textbox", { name: "Dungeon seed" });
				await user.clear(input);
				await user.type(input, "bad{Enter}");
				await user.click(screen.getByRole("button", { name: "New Dungeon" }));
				expect(screen.getByLabelText("Current dungeon seed").textContent).toBe(
					expected,
				);
				expect(input).toHaveValue(expected);
				expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			},
		);

		it("accepts the maximum unsigned 32-bit seed", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			const input = screen.getByRole("textbox", { name: "Dungeon seed" });
			await user.clear(input);
			await user.type(input, "4294967295{Enter}");
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^4294967295$/,
			);
			expect(generate).toHaveBeenCalledTimes(2);
		});

		it("replays the actual complete dungeon and its rendered first floor after another seed", async () => {
			const user = userEvent.setup();
			const connect = vi.spyOn(DungeonRun, "connectDungeonFloors");
			render(<Home />);
			const originalRun = structuredClone(connect.mock.results[0].value);
			const originalTerrain = screen.getByRole("table", {
				name: "Dungeon",
			}).innerHTML;
			const input = screen.getByRole("textbox", { name: "Dungeon seed" });
			await user.clear(input);
			await user.type(input, "123{Enter}");
			expect(screen.getByRole("table", { name: "Dungeon" }).innerHTML).not.toBe(
				originalTerrain,
			);
			await user.clear(input);
			await user.type(input, "0{Enter}");
			expect(connect.mock.results[2].value).toEqual(originalRun);
			expect(screen.getByRole("table", { name: "Dungeon" }).innerHTML).toBe(
				originalTerrain,
			);
			expect(
				screen.getByRole("heading", { name: "Floor 1 of 3" }),
			).toBeVisible();
		});
	});

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
			rows: 3,
			cols: 3,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
			downStair: {
				coordinate: { row: 1, col: 2 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});

		const floor2 = createTestDungeonFloor({
			floorNumber: 2,
			rows: 4,
			cols: 5,
			room: { startRow: 1, endRow: 2, startCol: 1, endCol: 3 },
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
			rows: 3,
			cols: 3,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
			downStair: {
				coordinate: { row: 1, col: 2 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});

		const floor2 = createTestDungeonFloor({
			floorNumber: 2,
			rows: 3,
			cols: 4,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
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
			rows: 3,
			cols: 3,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
			downStair: {
				coordinate: { row: 1, col: 2 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});

		const floor2 = createTestDungeonFloor({
			floorNumber: 2,
			rows: 4,
			cols: 5,
			room: { startRow: 1, endRow: 2, startCol: 1, endCol: 3 },
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

		// Move onto floor 1's down stair and descend.
		await user.keyboard("{ArrowRight}");

		// Player should remain on floor 2's up stair after arrival.
		expect(
			screen.getByRole("cell", {
				name: "row1col1 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		// Prove floor 2 is still the rendered floor.
		const dungeon = screen.getByRole("table", { name: "Dungeon" });
		const rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(4);

		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(5);
		}
	});

	it("only moves the player once after descending to the next floor", async () => {
		const user = userEvent.setup();

		const floor1 = createTestDungeonFloor({
			floorNumber: 1,
			rows: 3,
			cols: 3,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
			downStair: {
				coordinate: { row: 1, col: 2 },
				destinationFloor: 2,
				arrivalCoordinate: { row: 1, col: 1 },
			},
		});

		const floor2 = createTestDungeonFloor({
			floorNumber: 2,
			rows: 3,
			cols: 5,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 3 },
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

	it("ascends onto the linked shallower floor and arrives on its down stair", async () => {
		const user = userEvent.setup();
		const run = createThreeFloorTraversalRun();

		const runOnFloor2: DungeonRun.DungeonRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: { row: 1, col: 2 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(runOnFloor2);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(runOnFloor2);

		render(<Home />);

		await user.keyboard("{ArrowLeft}");

		expect(
			screen.getByRole("cell", {
				name: "row1col2 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		const dungeon = screen.getByRole("table", { name: "Dungeon" });
		const rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(3);

		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(4);
		}
	});

	it("does not immediately descend again after arriving on a down stair", async () => {
		const user = userEvent.setup();
		const run = createThreeFloorTraversalRun();

		const runOnFloor2: DungeonRun.DungeonRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: { row: 1, col: 2 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(runOnFloor2);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(runOnFloor2);

		render(<Home />);

		await user.keyboard("{ArrowLeft}");

		expect(
			screen.getByRole("cell", {
				name: "row1col2 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		// Floor 1 is still rendered.
		const dungeon = screen.getByRole("table", { name: "Dungeon" });
		const rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(3);

		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(4);
		}
	});

	it("allows normal movement after ascending to a previously visited floor", async () => {
		const user = userEvent.setup();
		const run = createThreeFloorTraversalRun();

		const runOnFloor2: DungeonRun.DungeonRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: { row: 1, col: 2 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(runOnFloor2);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(runOnFloor2);

		render(<Home />);

		// Ascend from floor 2 to floor 1.
		await user.keyboard("{ArrowLeft}");

		// Move away from floor 1's down stair.
		await user.keyboard("{ArrowLeft}");

		expect(
			screen.getByRole("cell", {
				name: "row1col1 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		expect(
			screen.getByRole("cell", {
				name: "row1col2 - stairs down",
			}),
		).toHaveTextContent(LayoutTiles.STAIRS_DOWN);
	});

	it("travels from floor 1 to 2 to 3 and back to 2 and 1 without regenerating floors", async () => {
		const user = userEvent.setup();
		const run = createThreeFloorTraversalRun();

		const generateSpy = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(run);

		const connectSpy = vi
			.spyOn(DungeonRun, "connectDungeonFloors")
			.mockReturnValue(run);

		render(<Home />);

		// Floor 1 -> Floor 2.
		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: "row1col1 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		// Walk across floor 2 to its down stair.
		await user.keyboard("{ArrowRight}");
		await user.keyboard("{ArrowRight}");

		// Now on floor 3 at its up stair.
		expect(
			screen.getByRole("cell", {
				name: "row1col1 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		let dungeon = screen.getByRole("table", { name: "Dungeon" });
		let rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(4);

		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(4);
		}

		// Move away, then step back onto floor 3's up stair.
		await user.keyboard("{ArrowRight}");
		await user.keyboard("{ArrowLeft}");

		// Back on floor 2, arriving at its down stair.
		expect(
			screen.getByRole("cell", {
				name: "row1col3 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		dungeon = screen.getByRole("table", { name: "Dungeon" });
		rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(3);

		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(5);
		}

		// Walk from floor 2's down stair back to its up stair.
		await user.keyboard("{ArrowLeft}");
		await user.keyboard("{ArrowLeft}");

		// Back on floor 1 at its down stair.
		expect(
			screen.getByRole("cell", {
				name: "row1col2 - player",
			}),
		).toHaveTextContent(LayoutTiles.PLAYER);

		dungeon = screen.getByRole("table", { name: "Dungeon" });
		rows = within(dungeon).getAllByRole("row");

		expect(rows).toHaveLength(3);

		for (const row of rows) {
			expect(within(row).getAllByRole("cell")).toHaveLength(4);
		}

		// Traversal must reuse the existing run, not generate replacement floors.
		expect(generateSpy).toHaveBeenCalledTimes(1);
		expect(connectSpy).toHaveBeenCalledTimes(1);
	});

	it("should show active floor name and total number of floors", () => {
		render(<Home />);

		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();
	});

	it("should show correct floor number after descending and ascending", async () => {
		const user = userEvent.setup();
		const run = createThreeFloorTraversalRun();

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);

		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);

		render(<Home />);

		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();

		// Floor 1 -> Floor 2.
		await user.keyboard("{ArrowRight}");
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();

		// Floor 2 -> 3
		await user.keyboard("{ArrowRight}");
		await user.keyboard("{ArrowRight}");
		expect(screen.getByRole("heading", { name: "Floor 3 of 3" })).toBeVisible();

		// Floor 3 -> 2
		await user.keyboard("{ArrowRight}");
		await user.keyboard("{ArrowLeft}");
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();

		// Floor 2 -> 1
		await user.keyboard("{ArrowLeft}");
		await user.keyboard("{ArrowLeft}");
		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();
	});

	it("should show correct number of floors with only 1 floor", async () => {
		const user = userEvent.setup();

		const floor1 = createTestDungeonFloor({
			floorNumber: 1,
			rows: 3,
			cols: 4,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
		});

		const singleFloorRun: DungeonRun.DungeonRun = {
			seed: 123,
			floors: [floor1],
			activeFloor: 1,
			playerCoordinate: { row: 1, col: 1 },
		};

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(singleFloorRun);

		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(
			singleFloorRun,
		);

		render(<Home />);

		expect(screen.getByRole("heading", { name: "Floor 1 of 1" })).toBeVisible();
		await user.keyboard("{ArrowRight}");
		expect(
			screen.getByRole("cell", { name: "row1col2 - player" }),
		).toHaveTextContent(LayoutTiles.PLAYER);
		expect(screen.getByRole("heading", { name: "Floor 1 of 1" })).toBeVisible();
	});

	it("should show correct floor number after descending, then reset to floor 1 after starting new dungeon", async () => {
		const user = userEvent.setup();
		const run = createThreeFloorTraversalRun();

		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);

		render(<Home />);

		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();

		// Floor 1 -> Floor 2.
		await user.keyboard("{ArrowRight}");
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();

		await user.click(screen.getByRole("button", { name: "New Dungeon" }));

		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();
	});
});
