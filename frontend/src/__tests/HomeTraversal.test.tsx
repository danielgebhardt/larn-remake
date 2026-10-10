import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import * as DungeonRun from "../domain/dungeon/DungeonRun.ts";
import Home from "../Home.tsx";
import {
	renderHome as render,
	resetHomeTestState,
	stubDungeonRun,
} from "./HomeTestHelpers.tsx";
import {
	createTestDungeonFloor,
	createThreeFloorTraversalRun,
	createTwoFloorTraversalRun,
} from "./testhelpers.ts";

afterEach(resetHomeTestState);

describe("Home floor traversal", () => {
	const floorRenderingConfig = {
		rows: 7,
		cols: 11,
		minPartitionSize: 8,
		roomPadding: 1,
		minRoomSize: 3,
		maxRoomAspectRatio: 3,
	};
	it("renders the active floor and its stair markers", () => {
		const run = DungeonRun.connectDungeonFloors(
			DungeonRun.generateDungeonRun(123, 3, floorRenderingConfig),
		);

		stubDungeonRun(run);

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
			DungeonRun.generateDungeonRun(123, 3, floorRenderingConfig),
		);

		const floor1 = run.floors[0];
		const floor2 = run.floors[1];

		// Give the two floors an obvious display difference.
		floor1.terrain = floor1.terrain.map((row, rowIndex) =>
			rowIndex === 0 ? ["1", ...row.slice(1)] : row,
		);
		floor2.terrain = floor2.terrain.map((row, rowIndex) =>
			rowIndex === 0 ? ["2", ...row.slice(1)] : row,
		);

		const activeRun = {
			...run,
			activeFloor: 2,
			playerCoordinate: { row: 1, col: 1 },
		};

		stubDungeonRun(activeRun);

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
			DungeonRun.generateDungeonRun(123, 3, floorRenderingConfig),
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

		stubDungeonRun(activeRun);

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

		const run = createTwoFloorTraversalRun();

		stubDungeonRun(run);

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

		const run = createTwoFloorTraversalRun({
			rows: 3,
			cols: 4,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
		});

		stubDungeonRun(run);

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

		const run = createTwoFloorTraversalRun();

		stubDungeonRun(run);

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

		const run = createTwoFloorTraversalRun({
			rows: 3,
			cols: 5,
			room: { startRow: 1, endRow: 1, startCol: 1, endCol: 3 },
		});

		stubDungeonRun(run);

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

		stubDungeonRun(runOnFloor2);

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

		stubDungeonRun(runOnFloor2);

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

		stubDungeonRun(runOnFloor2);

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

		stubDungeonRun(run);

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
});
