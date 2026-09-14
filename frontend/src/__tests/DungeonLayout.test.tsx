import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import DungeonLayout from "../DungeonLayout.tsx";
import { fixedDungeon, START_COORDINATE } from "../LayoutTiles.ts";

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

	it("should move player up when pressing Up key", async () => {
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

		expect(screen.getByRole("cell", { name: "row0col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);
	});

	it("should move player up when pressing 'w' key", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("w");

		expect(screen.getByRole("cell", { name: "row0col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);
	});

	it("should move player down when pressing down key", async () => {
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
	});

	it("should move player down when pressing 's' key", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("s");

		expect(screen.getByRole("cell", { name: "row2col1" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);
	});

	it("should move player left when pressing left key", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("{ArrowLeft}");

		expect(screen.getByRole("cell", { name: "row1col0" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);
	});

	it("should move player left when pressing 'a' key", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("a");

		expect(screen.getByRole("cell", { name: "row1col0" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);
	});

	it("should move player right when pressing right key", async () => {
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
	});

	it("should move player right when pressing 'd' key", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);

		await userEvent.keyboard("d");

		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			"@",
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);
	});
});
