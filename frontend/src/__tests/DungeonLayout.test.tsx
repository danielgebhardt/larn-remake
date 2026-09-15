import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import DungeonLayout from "../DungeonLayout.tsx";
import { FLOOR, fixedDungeon, START_COORDINATE } from "../LayoutTiles.ts";

describe("DungeonLayout Tests", () => {
	it("renders a simple 5 x 5 dungeon by default", () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row0col0" })).toHaveTextContent(
			"#",
		);
		expect(screen.getByRole("cell", { name: "row1col0" })).toHaveTextContent(
			"#",
		);
		expect(screen.getByRole("cell", { name: "row1col3" })).toHaveTextContent(
			".",
		);
		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			".",
		);
		expect(screen.getByRole("cell", { name: "row4col4" })).toHaveTextContent(
			"#",
		);
	});

	it("should start with Player in 1,1 position by default", () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);
	});

	it("should move player down and up when pressing Up, Down, 's', and 'w' keys", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowDown}");

		expect(screen.getByRole("cell", { name: "row2col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("{ArrowUp}");

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row2col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("s");

		expect(screen.getByRole("cell", { name: "row2col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("w");

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row2col1" })).toHaveTextContent(
			".",
		);
	});

	it("should move player right and left when pressing Right, Left, 'd', and 'a' keys", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowRight}");

		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("{ArrowLeft}");

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("d");

		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("a");

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			".",
		);
	});

	it("should not let player move into a wall when moving left or up", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowUp}");

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowLeft}");

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);
	});

	it("should not let player move into a wall when moving right or down", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={{ row: 3, col: 3 }}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row3col3" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowDown}");

		expect(screen.getByRole("cell", { name: "row3col3" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowRight}");

		expect(screen.getByRole("cell", { name: "row3col3" })).toHaveTextContent(
			"@",
		);
	});

	it("should not allow player to move out of bounds for moving left or up", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={{ row: 0, col: 0 }}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row0col0" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowUp}");

		expect(screen.getByRole("cell", { name: "row0col0" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowLeft}");

		expect(screen.getByRole("cell", { name: "row0col0" })).toHaveTextContent(
			"@",
		);
	});

	it("should not allow player to move out of bounds for moving right or down", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={{ row: 4, col: 4 }}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row4col4" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowDown}");

		expect(screen.getByRole("cell", { name: "row4col4" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowRight}");

		expect(screen.getByRole("cell", { name: "row4col4" })).toHaveTextContent(
			"@",
		);
	});

	it("should not allow movement out of bounds in asymmetric dungeon", async () => {
		render(
			<DungeonLayout
				dungeon={[
					[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
					[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
					[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
				]}
				startingPlayerPosition={{ row: 1, col: 3 }}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col3" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowRight}");

		expect(screen.getByRole("cell", { name: "row1col4" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowRight}");

		expect(screen.getByRole("cell", { name: "row1col4" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowDown}");

		expect(screen.getByRole("cell", { name: "row2col4" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowDown}");

		expect(screen.getByRole("cell", { name: "row2col4" })).toHaveTextContent(
			"@",
		);
	});
});
