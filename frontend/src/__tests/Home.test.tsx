import {
	render as renderUI,
	screen,
	waitFor,
	within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import type { ReactElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as DungeonRun from "../DungeonRun.ts";
import Home from "../Home.tsx";
import * as LayoutTiles from "../LayoutTiles.ts";
import { STAIRS_DOWN, STAIRS_UP } from "../LayoutTiles.ts";
import { server } from "../mocks/server.ts";
import { ThemeProvider } from "../ThemeProvider";
import { createTestDungeonFloor } from "./testhelpers.ts";

const render = (ui: ReactElement) => renderUI(ui, { wrapper: ThemeProvider });

afterEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove("dark");
	document.documentElement.style.removeProperty("color-scheme");
	vi.restoreAllMocks();
});

const openSettings = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.click(screen.getByRole("button", { name: "Settings" }));
	await screen.findByRole("dialog", { name: "Settings" });
	return screen.getByRole("textbox", { name: "Dungeon seed" });
};

const waitForSettingsClosed = () =>
	waitFor(() => {
		expect(
			screen.queryByRole("dialog", { name: "Settings" }),
		).not.toBeInTheDocument();
	});

const closeSettings = async (user: ReturnType<typeof userEvent.setup>) => {
	await user.keyboard("{Escape}");
	await waitForSettingsClosed();
};

const editConfiguration = async (
	user: ReturnType<typeof userEvent.setup>,
	rows: string,
	columns: string,
	floors: string,
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

const pathTo = (
	terrain: LayoutTiles.Dungeon,
	start: LayoutTiles.Coordinate,
	target: LayoutTiles.Coordinate,
): string => {
	const queue = [{ ...start, keys: "" }];
	const visited = new Set([`${start.row},${start.col}`]);
	for (const current of queue) {
		if (current.row === target.row && current.col === target.col)
			return current.keys;
		for (const [row, col, key] of [
			[current.row - 1, current.col, "ArrowUp"],
			[current.row + 1, current.col, "ArrowDown"],
			[current.row, current.col - 1, "ArrowLeft"],
			[current.row, current.col + 1, "ArrowRight"],
		] as const) {
			if (
				terrain[row]?.[col] !== LayoutTiles.FLOOR ||
				visited.has(`${row},${col}`)
			)
				continue;
			visited.add(`${row},${col}`);
			queue.push({ row, col, keys: `${current.keys}{${key}}` });
		}
	}
	throw new Error("Test fixture has no path to stairs");
};

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
	it("rejects invalid configuration without losing exploration or drafts and clears corrected field feedback", async () => {
		const run = createThreeFloorTraversalRun();
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		const user = userEvent.setup();
		render(<Home />);
		await user.keyboard("{ArrowRight}{ArrowRight}");
		const board = screen.getByRole("table");
		const original = board.innerHTML;
		await openSettings(user);
		await editConfiguration(user, "4", "101", "0");
		await user.click(screen.getByRole("button", { name: "Start from seed" }));
		expect(screen.getAllByRole("alert")).toHaveLength(3);
		for (const name of ["Rows", "Columns", "Floors"])
			expect(screen.getByRole("textbox", { name })).toHaveAttribute(
				"aria-invalid",
				"true",
			);
		expect(
			screen.getByRole("textbox", { name: "Rows" }),
		).toHaveAccessibleDescription(/Enter a whole number from 10 to 100/);
		expect(board.innerHTML).toBe(original);
		expect(generate).toHaveBeenCalledTimes(1);
		await closeSettings(user);
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();
		await openSettings(user);
		expect(screen.getByRole("textbox", { name: "Columns" })).toHaveValue("101");
		await user.clear(screen.getByRole("textbox", { name: "Rows" }));
		await user.type(screen.getByRole("textbox", { name: "Rows" }), "10");
		expect(screen.getByRole("textbox", { name: "Rows" })).toHaveAttribute(
			"aria-invalid",
			"false",
		);
		expect(screen.getAllByRole("alert")).toHaveLength(2);
	});
	it.each(["terrain", "stairs"])(
		"preserves the run and active configuration when %s generation fails, then allows retry",
		async (stage) => {
			const run = createThreeFloorTraversalRun();
			const generate = vi
				.spyOn(DungeonRun, "generateDungeonRun")
				.mockReturnValue(run);
			const connect = vi
				.spyOn(DungeonRun, "connectDungeonFloors")
				.mockReturnValue(run);
			const user = userEvent.setup();
			render(<Home />);
			await user.keyboard("{ArrowRight}");
			const board = screen.getByRole("table");
			const original = board.innerHTML;
			await openSettings(user);
			await editConfiguration(user, "10", "10", "2");
			(stage === "terrain" ? generate : connect).mockImplementationOnce(() => {
				throw new Error("generation failed");
			});
			await user.click(screen.getByRole("button", { name: "Start from seed" }));
			expect(screen.getByRole("alert")).toHaveTextContent(
				"Try a different seed or larger dimensions",
			);
			expect(board.innerHTML).toBe(original);
			expect(screen.getByRole("textbox", { name: "Rows" })).toHaveValue("10");
			expect(
				screen.getByLabelText("Current dungeon configuration"),
			).toHaveTextContent("30 rows × 100 columns · 3 floors");
			await closeSettings(user);
			expect(
				screen.getByRole("heading", { name: "Floor 2 of 3" }),
			).toBeVisible();
			await user.click(screen.getByRole("button", { name: "New Dungeon" }));
			expect(generate).toHaveBeenLastCalledWith(expect.any(Number), 3, {
				rows: 30,
				cols: 100,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
			});
			await openSettings(user);
			expect(screen.getByRole("textbox", { name: "Rows" })).toHaveValue("30");
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
		},
	);
	it("replays configured floors and stairs, resets exploration, and reuses active settings for random restarts", async () => {
		const originalGenerate = DungeonRun.generateDungeonRun;
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockImplementation(originalGenerate)
			.mockReturnValueOnce(createThreeFloorTraversalRun());
		const expected = DungeonRun.connectDungeonFloors(
			originalGenerate(123, 2, {
				rows: 10,
				cols: 15,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
			}),
		);
		const user = userEvent.setup();
		render(<Home />);
		await user.keyboard("{ArrowRight}");
		const seed = await openSettings(user);
		await user.clear(seed);
		await user.type(seed, "123");
		await editConfiguration(user, "10", "15", "2");
		await user.click(screen.getByRole("button", { name: "Start from seed" }));
		await waitForSettingsClosed();
		expect(screen.getByRole("heading", { name: "Floor 1 of 2" })).toBeVisible();
		const firstBoard = screen.getByRole("table").innerHTML;
		const first = expected.floors[0];
		if (!first.downStair) throw new Error("Fixture must have a down stair");
		const keys = pathTo(
			first.terrain,
			expected.playerCoordinate,
			first.downStair.coordinate,
		);
		await user.keyboard(keys);
		expect(screen.getByRole("heading", { name: "Floor 2 of 2" })).toBeVisible();
		const secondBoard = screen.getByRole("table").innerHTML;
		await openSettings(user);
		await user.click(screen.getByRole("button", { name: "Start from seed" }));
		await waitForSettingsClosed();
		expect(screen.getByRole("heading", { name: "Floor 1 of 2" })).toBeVisible();
		expect(screen.getByRole("table").innerHTML).toBe(firstBoard);
		await user.keyboard(keys);
		expect(screen.getByRole("table").innerHTML).toBe(secondBoard);
		await openSettings(user);
		await editConfiguration(user, "20", "25", "4");
		await closeSettings(user);
		vi.spyOn(Math, "random").mockReturnValue(0);
		await user.click(screen.getByRole("button", { name: "New Dungeon" }));
		expect(generate).toHaveBeenLastCalledWith(0, 2, {
			rows: 10,
			cols: 15,
			minPartitionSize: 8,
			roomPadding: 1,
			minRoomSize: 3,
			maxRoomAspectRatio: 3,
		});
		expect(screen.getByRole("heading", { name: "Floor 1 of 2" })).toBeVisible();
		expect(within(screen.getByRole("table")).getAllByRole("cell")).toHaveLength(
			150,
		);
		await openSettings(user);
		expect(screen.getByRole("textbox", { name: "Rows" })).toHaveValue("10");
		expect(screen.getByRole("textbox", { name: "Floors" })).toHaveValue("2");
		expect(screen.getByRole("textbox", { name: "Dungeon seed" })).toHaveValue(
			"0",
		);
	});
	it("keeps configuration edits as drafts and applies a rectangular single-floor run explicitly", async () => {
		const user = userEvent.setup();
		render(<Home />);
		const board = screen.getByRole("table");
		const original = board.innerHTML;
		await openSettings(user);
		expect(screen.getByRole("textbox", { name: "Rows" })).toHaveValue("30");
		expect(screen.getByRole("textbox", { name: "Columns" })).toHaveValue("100");
		expect(screen.getByRole("textbox", { name: "Floors" })).toHaveValue("3");
		for (const [name, value] of [
			["Rows", "10"],
			["Columns", "15"],
			["Floors", "1"],
		]) {
			const field = screen.getByRole("textbox", { name });
			await user.clear(field);
			await user.type(field, value);
		}
		expect(board.innerHTML).toBe(original);
		await closeSettings(user);
		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();
		await openSettings(user);
		expect(screen.getByRole("textbox", { name: "Rows" })).toHaveValue("10");
		await user.click(screen.getByRole("button", { name: "Start from seed" }));
		await waitForSettingsClosed();
		expect(screen.getByRole("heading", { name: "Floor 1 of 1" })).toBeVisible();
		expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
			10,
		);
		expect(within(screen.getByRole("table")).getAllByRole("cell")).toHaveLength(
			150,
		);
		expect(
			screen.queryByRole("cell", { name: /stairs/ }),
		).not.toBeInTheDocument();
		await openSettings(user);
		expect(
			screen.getByLabelText("Current dungeon configuration"),
		).toHaveTextContent("10 rows × 15 columns · 1 floor");
	});
	it("changes appearance with mouse and keyboard without losing exploration, seed draft, or errors", async () => {
		const run = createThreeFloorTraversalRun();
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		const user = userEvent.setup();
		render(<Home />);
		await user.keyboard("{ArrowRight}{ArrowRight}");
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();
		const board = screen.getByRole("table");
		const terrain = board.innerHTML;
		const input = await openSettings(user);
		await user.clear(input);
		await user.type(input, "invalid");
		await user.click(screen.getByRole("button", { name: "Start from seed" }));
		const error = screen.getByRole("alert").textContent;
		expect(
			screen.getByRole("button", { name: "Dark", pressed: true }),
		).toBeVisible();
		await user.click(screen.getByRole("button", { name: "Light" }));
		expect(document.documentElement).not.toHaveClass("dark");
		expect(
			screen.getByRole("button", { name: "Light", pressed: true }),
		).toHaveFocus();
		await user.keyboard("{ArrowRight} ");
		expect(
			screen.getByRole("button", { name: "Dark", pressed: true }),
		).toHaveFocus();
		expect(document.documentElement).toHaveClass("dark");
		expect(input).toHaveValue("invalid");
		expect(screen.getByRole("alert")).toHaveTextContent(error ?? "");
		expect(board.innerHTML).toBe(terrain);
		expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
			"123",
		);
		await closeSettings(user);
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();
		await openSettings(user);
		expect(
			screen.getByRole("button", { name: "Dark", pressed: true }),
		).toBeVisible();
		await closeSettings(user);
		await user.keyboard("{ArrowLeft}{ArrowLeft}");
		expect(screen.getByRole("heading", { name: "Floor 1 of 3" })).toBeVisible();
		expect(generate).toHaveBeenCalledTimes(1);
	});
	it("opens settings from the header, focuses the seed field, and restores focus on dismissal", async () => {
		const run = createThreeFloorTraversalRun();
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		const user = userEvent.setup();
		render(<Home />);
		const trigger = within(screen.getByRole("banner")).getByRole("button", {
			name: "Settings",
		});
		expect(
			screen.queryByRole("textbox", { name: "Dungeon seed" }),
		).not.toBeInTheDocument();
		expect(
			screen.queryByLabelText("Current dungeon seed"),
		).not.toBeInTheDocument();
		await user.click(trigger);
		const panel = await screen.findByRole("dialog", { name: "Settings" });
		expect(
			within(panel).getByLabelText("Current dungeon seed"),
		).toHaveTextContent("123");
		await waitFor(() =>
			expect(
				within(panel).getByRole("textbox", { name: "Dungeon seed" }),
			).toHaveFocus(),
		);
		await user.keyboard("{Escape}");
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(trigger).toHaveFocus();
		expect(generate).toHaveBeenCalledTimes(1);
		await user.click(trigger);
		await user.click(
			within(await screen.findByRole("dialog", { name: "Settings" })).getByRole(
				"button",
				{ name: "Close" },
			),
		);
		await waitFor(() =>
			expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
		);
		expect(trigger).toHaveFocus();
		expect(generate).toHaveBeenCalledTimes(1);
	});
	it("keeps a failed server check in the footer while dungeon exploration works", async () => {
		server.use(
			http.get("/initial", () => new HttpResponse(null, { status: 500 })),
		);
		const run = createThreeFloorTraversalRun();
		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		const user = userEvent.setup();
		render(<Home />);

		const footer = screen.getByRole("contentinfo");
		expect(await within(footer).findByRole("alert")).toHaveTextContent(
			"Failed to load from server",
		);
		expect(
			within(screen.getByRole("main")).queryByRole("alert"),
		).not.toBeInTheDocument();
		await user.keyboard("{ArrowRight}");
		expect(screen.getByRole("heading", { name: "Floor 2 of 3" })).toBeVisible();
	});
	it("opens settings with the keyboard without restarting or moving the player", async () => {
		const run = createThreeFloorTraversalRun();
		const generate = vi
			.spyOn(DungeonRun, "generateDungeonRun")
			.mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		const user = userEvent.setup();
		render(<Home />);
		await user.tab();
		expect(screen.getByRole("button", { name: "New Dungeon" })).toHaveFocus();
		await user.tab();
		expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
		await user.keyboard("{Enter}");
		expect(
			await screen.findByRole("dialog", { name: "Settings" }),
		).toBeVisible();
		await waitFor(() =>
			expect(
				screen.getByRole("textbox", { name: "Dungeon seed" }),
			).toHaveFocus(),
		);
		await closeSettings(user);
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
		expect(generate).toHaveBeenCalledTimes(1);
	});
	it("groups the title, current depth, and New Dungeon action in the header", () => {
		const run = createThreeFloorTraversalRun();
		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		render(<Home />);

		const toolbar = screen.getByRole("banner");
		expect(
			within(toolbar).getByRole("heading", { name: "Larn Remake" }),
		).toBeVisible();
		expect(
			within(toolbar).getByRole("heading", { name: "Floor 1 of 3" }),
		).toBeVisible();
		expect(
			within(toolbar).getByRole("button", { name: "New Dungeon" }),
		).toBeVisible();
	});
	it("explains the player and both stair directions with a graphical legend", () => {
		const run = createThreeFloorTraversalRun();
		vi.spyOn(DungeonRun, "generateDungeonRun").mockReturnValue(run);
		vi.spyOn(DungeonRun, "connectDungeonFloors").mockReturnValue(run);
		render(<Home />);

		const legend = screen.getByRole("list", { name: "Dungeon legend" });
		expect(within(legend).getByText("Player")).toBeVisible();
		expect(within(legend).getByText("Stairs up")).toBeVisible();
		expect(within(legend).getByText("Stairs down")).toBeVisible();
		const entries = within(legend).getAllByRole("listitem");
		expect(entries).toHaveLength(3);
		for (const entry of entries) {
			expect(entry.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
		}
	});
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
			const descriptions: Record<string, string> = {
				[LayoutTiles.WALL]: "wall",
				[LayoutTiles.FLOOR]: "floor",
				[LayoutTiles.PLAYER]: "player",
				[STAIRS_UP]: "stairs up",
				[STAIRS_DOWN]: "stairs down",
			};
			const table = screen.getByRole("table", { name: "Dungeon" });
			const actual = within(table)
				.getAllByRole("row")
				.map((row) =>
					within(row)
						.getAllByRole("cell")
						.map((cell) => cell.getAttribute("aria-label")),
				);
			expect(actual).toEqual(
				expected.map((row, rowIndex) =>
					row.map(
						(tile, colIndex) =>
							`row${rowIndex}col${colIndex} - ${descriptions[tile]}`,
					),
				),
			);
			expect(
				screen.getByRole("heading", { name: `Floor ${floorNumber} of 3` }),
			).toBeVisible();
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

		const input = await openSettings(user);
		await user.clear(input);
		await user.type(input, "0{Enter}");
		await waitForSettingsClosed();
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
			expect(await openSettings(user)).toHaveValue(String(seed));
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				String(seed),
			);
			await closeSettings(user);
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

	describe("Seed replay in settings", () => {
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
			const generate = mockRunGeneration();
			render(<Home />);
			const input = await openSettings(user);
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^0$/,
			);
			await user.clear(input);
			await user.type(input, "123");
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^0$/,
			);
			await closeSettings(user);
			expect(generate).toHaveBeenCalledTimes(1);
		});

		it("submits an entered seed with the current configuration, closes settings, and resets depth and position", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			await user.keyboard("{ArrowRight}{ArrowRight}");
			expect(
				screen.getByRole("heading", { name: "Floor 2 of 3" }),
			).toBeVisible();
			const input = await openSettings(user);
			await user.clear(input);
			await user.type(input, "123");
			await user.click(screen.getByRole("button", { name: "Start from seed" }));
			await waitForSettingsClosed();
			expect(screen.getByRole("button", { name: "Settings" })).toHaveFocus();
			expect(generate).toHaveBeenCalledTimes(2);
			expect(generate).toHaveBeenLastCalledWith(123, 3, {
				rows: 30,
				cols: 100,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
			});
			expect(
				screen.getByRole("heading", { name: "Floor 1 of 3" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();
			expect(await openSettings(user)).toHaveValue("123");
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^123$/,
			);
		});

		it("resets repeated replays of the same seed, including submission with Enter", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			for (let replay = 0; replay < 2; replay++) {
				await user.keyboard("{ArrowRight}");
				expect(
					screen.getByRole("heading", { name: "Floor 2 of 3" }),
				).toBeVisible();
				const input = await openSettings(user);
				await user.clear(input);
				await user.type(input, "0{Enter}");
				await waitForSettingsClosed();
				expect(
					screen.getByRole("heading", { name: "Floor 1 of 3" }),
				).toBeVisible();
				expect(
					screen.getByRole("cell", { name: "row1col1 - player" }),
				).toBeVisible();
			}
			expect(generate).toHaveBeenCalledTimes(3);
		});

		it("keeps typing and arrow keys separate from movement and retains the run on rerender", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			const { rerender } = render(<Home />);
			const dungeon = screen.getByRole("table", { name: "Dungeon" });
			const before = dungeon.innerHTML;
			const input = await openSettings(user);
			await user.clear(input);
			await user.type(input, "wasd");
			await user.keyboard("{ArrowLeft}{ArrowRight}{ArrowUp}{ArrowDown}");
			rerender(<Home />);
			expect(input).toHaveValue("wasd");
			expect(dungeon.innerHTML).toBe(before);
			expect(generate).toHaveBeenCalledTimes(1);
		});

		it.each(["", "abc", "-1", "1.5", "1e3", "0x10", "4294967296"])(
			"reports invalid seed %j and keeps settings open without changing the explored run",
			async (value) => {
				const user = userEvent.setup();
				const generate = mockRunGeneration();
				render(<Home />);
				await user.keyboard("{ArrowRight}");
				const dungeon = screen.getByRole("table", { name: "Dungeon" });
				const before = dungeon.innerHTML;
				const input = await openSettings(user);
				await user.clear(input);
				if (value) await user.type(input, value);
				await user.click(
					screen.getByRole("button", { name: "Start from seed" }),
				);
				expect(screen.getByRole("dialog", { name: "Settings" })).toBeVisible();
				expect(screen.getByRole("alert")).toHaveTextContent(
					"Enter a whole number from 0 to 4294967295.",
				);
				expect(input).toHaveAttribute("aria-invalid", "true");
				expect(input).toHaveAccessibleDescription(
					"Enter a whole number from 0 to 4294967295.",
				);
				expect(dungeon.innerHTML).toBe(before);
				expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
					/^0$/,
				);
				await closeSettings(user);
				expect(
					screen.getByRole("heading", { name: "Floor 2 of 3" }),
				).toBeVisible();
				expect(generate).toHaveBeenCalledTimes(1);
			},
		);

		it("clears invalid feedback after correction and accepts a normalized seed", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			const input = await openSettings(user);
			await user.clear(input);
			await user.type(input, "bad{Enter}");
			expect(screen.getByRole("alert")).toBeVisible();
			await user.clear(input);
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			await user.type(input, " 00123 {Enter}");
			await waitForSettingsClosed();
			const reopenedInput = await openSettings(user);
			expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			expect(reopenedInput).toHaveAttribute("aria-invalid", "false");
			expect(reopenedInput).toHaveValue("123");
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
			"shows the current random seed $expected on reopening and clears invalid feedback",
			async ({ random, expected }) => {
				const user = userEvent.setup();
				mockRunGeneration();
				vi.spyOn(Math, "random").mockReturnValue(random);
				render(<Home />);
				const input = await openSettings(user);
				await user.clear(input);
				await user.type(input, "bad{Enter}");
				await closeSettings(user);
				await user.click(screen.getByRole("button", { name: "New Dungeon" }));
				expect(await openSettings(user)).toHaveValue(expected);
				expect(screen.getByLabelText("Current dungeon seed").textContent).toBe(
					expected,
				);
				expect(screen.queryByRole("alert")).not.toBeInTheDocument();
			},
		);

		it("accepts the maximum unsigned 32-bit seed", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			const input = await openSettings(user);
			await user.clear(input);
			await user.type(input, "4294967295{Enter}");
			await waitForSettingsClosed();
			expect(generate).toHaveBeenLastCalledWith(
				4294967295,
				3,
				expect.any(Object),
			);
			expect(generate).toHaveBeenCalledTimes(2);
			expect(await openSettings(user)).toHaveValue("4294967295");
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^4294967295$/,
			);
		});

		it("replays the actual complete dungeon and its rendered first floor after another seed", async () => {
			const user = userEvent.setup();
			const connect = vi.spyOn(DungeonRun, "connectDungeonFloors");
			render(<Home />);
			const originalRun = structuredClone(connect.mock.results[0].value);
			const originalTerrain = screen.getByRole("table", {
				name: "Dungeon",
			}).innerHTML;
			let input = await openSettings(user);
			await user.clear(input);
			await user.type(input, "123{Enter}");
			await waitForSettingsClosed();
			expect(screen.getByRole("table", { name: "Dungeon" }).innerHTML).not.toBe(
				originalTerrain,
			);
			input = await openSettings(user);
			await user.clear(input);
			await user.type(input, "0{Enter}");
			await waitForSettingsClosed();
			expect(connect.mock.results[2].value).toEqual(originalRun);
			expect(screen.getByRole("table", { name: "Dungeon" }).innerHTML).toBe(
				originalTerrain,
			);
			expect(
				screen.getByRole("heading", { name: "Floor 1 of 3" }),
			).toBeVisible();
		});

		it("preserves depth, player, terrain, and links when a draft is dismissed", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			await user.keyboard("{ArrowRight}{ArrowRight}");
			const before = screen.getByRole("table", { name: "Dungeon" }).innerHTML;
			const input = await openSettings(user);
			await user.clear(input);
			await user.type(input, "456");
			await closeSettings(user);
			expect(
				screen.getByRole("heading", { name: "Floor 2 of 3" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "row1col2 - player" }),
			).toBeVisible();
			expect(screen.getByRole("table", { name: "Dungeon" }).innerHTML).toBe(
				before,
			);
			expect(generate).toHaveBeenCalledTimes(1);
			expect(await openSettings(user)).toHaveValue("456");
			expect(screen.getByLabelText("Current dungeon seed")).toHaveTextContent(
				/^0$/,
			);
			await closeSettings(user);
			await user.keyboard("{ArrowRight}");
			expect(
				screen.getByRole("heading", { name: "Floor 3 of 3" }),
			).toBeVisible();
		});

		it("suspends all game movement and stair transitions while focus is on a settings button", async () => {
			const user = userEvent.setup();
			const generate = mockRunGeneration();
			render(<Home />);
			const dungeon = screen.getByRole("table", { name: "Dungeon" });
			const before = dungeon.innerHTML;
			await openSettings(user);
			screen.getByRole("button", { name: "Start from seed" }).focus();
			for (const key of [
				"{ArrowRight}",
				"{ArrowLeft}",
				"{ArrowUp}",
				"{ArrowDown}",
				"w",
				"a",
				"s",
				"d",
			]) {
				await user.keyboard(key);
				expect(dungeon.innerHTML).toBe(before);
			}
			await closeSettings(user);
			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();
			await user.keyboard("{ArrowRight}");
			expect(
				screen.getByRole("heading", { name: "Floor 2 of 3" }),
			).toBeVisible();
			expect(generate).toHaveBeenCalledTimes(1);
		});

		it("contains keyboard focus in settings while tabbing forward and backward", async () => {
			const user = userEvent.setup();
			mockRunGeneration();
			render(<Home />);
			await openSettings(user);
			const panel = screen.getByRole("dialog", { name: "Settings" });
			for (let i = 0; i < 6; i++) {
				await user.tab();
				await waitFor(() =>
					expect(panel).toContainElement(document.activeElement as HTMLElement),
				);
			}
			for (let i = 0; i < 6; i++) {
				await user.tab({ shift: true });
				await waitFor(() =>
					expect(panel).toContainElement(document.activeElement as HTMLElement),
				);
			}
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
			minPartitionSize: 8,
			roomPadding: 1,
			minRoomSize: 3,
			maxRoomAspectRatio: 3,
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
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
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

				if (tile === LayoutTiles.WALL) {
					expect(
						screen.getByRole("cell", {
							name: `row${rowIndex}col${colIndex} - wall`,
						}),
					).toBeVisible();
				} else {
					expect(
						screen.getByRole("cell", {
							name: `row${rowIndex}col${colIndex} - floor`,
						}),
					).toBeVisible();
				}
			}
		}
	});

	it("starts the player at the selected generated floor coordinate", () => {
		const generated = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 8,
			roomPadding: 1,
			minRoomSize: 3,
			maxRoomAspectRatio: 3,
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
		).toBeVisible();
	});

	it("does not generate another dungeon on an ordinary rerender", () => {
		const generated = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 8,
			roomPadding: 1,
			minRoomSize: 3,
			maxRoomAspectRatio: 3,
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
			minPartitionSize: 8,
			roomPadding: 1,
			minRoomSize: 3,
			maxRoomAspectRatio: 3,
		});
		vi.spyOn(LayoutTiles, "generateDungeon").mockReturnValue(generated);

		const start = LayoutTiles.selectPlayerStart(generated);
		expect(start).toEqual({ row: 2, col: 3 });
		expect(generated.terrain[2][4]).toBe(LayoutTiles.FLOOR);

		const { rerender } = render(<Home />);

		await userEvent.keyboard("{ArrowRight}");
		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toBeVisible();

		rerender(<Home />);

		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toBeVisible();
	});

	it("replaces the rendered dungeon and resets the player when New Dungeon is clicked", async () => {
		const user = userEvent.setup();

		const firstRun = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, {
				rows: 7,
				cols: 11,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
			}),
		);

		const secondRun = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(456, 3, {
				rows: 5,
				cols: 7,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
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
		).toBeVisible();

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
		).toBeVisible();
	});

	it("resets the player on every new dungeon even when the seed and starting position repeat", async () => {
		const user = userEvent.setup();
		const generated = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 8,
			roomPadding: 1,
			minRoomSize: 3,
			maxRoomAspectRatio: 3,
		});

		vi.spyOn(LayoutTiles, "generateDungeon").mockReturnValue(generated);
		vi.spyOn(Math, "random").mockReturnValue(0.5);

		render(<Home />);

		for (let generation = 0; generation < 2; generation++) {
			await user.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row2col4 - player" }),
			).toBeVisible();

			await user.click(screen.getByRole("button", { name: "New Dungeon" }));

			expect(
				screen.getByRole("cell", { name: "row2col3 - player" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "row2col4 - floor" }),
			).toBeVisible();
		}
	});

	it("uses the replacement terrain for movement and moves only once per keypress", async () => {
		const user = userEvent.setup();
		const first = LayoutTiles.generateDungeon({
			rows: 5,
			cols: 7,
			minPartitionSize: 8,
			roomPadding: 1,
			minRoomSize: 3,
			maxRoomAspectRatio: 3,
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

		expect(screen.getByRole("cell", { name: "row1col3 - wall" })).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row2col3 - player" }),
		).toBeVisible();

		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", { name: "row2col3 - floor" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row2col5 - floor" }),
		).toBeVisible();
	});

	it("renders the active floor and its stair markers", () => {
		const run = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, {
				rows: 7,
				cols: 11,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
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
		).toBeVisible();
	});

	it("renders only the active floor", () => {
		const run = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, {
				rows: 7,
				cols: 11,
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
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
				minPartitionSize: 8,
				roomPadding: 1,
				minRoomSize: 3,
				maxRoomAspectRatio: 3,
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
		).toBeVisible();

		expect(
			screen.getByRole("cell", {
				name: `row${floor2.upStair.coordinate.row}col${floor2.upStair.coordinate.col} - stairs up`,
			}),
		).toBeVisible();
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
		).toBeVisible();

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
		).toBeVisible();

		// Move normally on floor 2.
		await user.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", {
				name: "row1col2 - player",
			}),
		).toBeVisible();

		expect(
			screen.getByRole("cell", {
				name: "row1col1 - stairs up",
			}),
		).toBeVisible();
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
		).toBeVisible();

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
		).toBeVisible();

		expect(
			screen.getByRole("cell", {
				name: "row1col3 - floor",
			}),
		).toBeVisible();
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
		).toBeVisible();

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
		).toBeVisible();

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
		).toBeVisible();

		expect(
			screen.getByRole("cell", {
				name: "row1col2 - stairs down",
			}),
		).toBeVisible();
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
		).toBeVisible();

		// Walk across floor 2 to its down stair.
		await user.keyboard("{ArrowRight}");
		await user.keyboard("{ArrowRight}");

		// Now on floor 3 at its up stair.
		expect(
			screen.getByRole("cell", {
				name: "row1col1 - player",
			}),
		).toBeVisible();

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
		).toBeVisible();

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
		).toBeVisible();

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
		).toBeVisible();
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
