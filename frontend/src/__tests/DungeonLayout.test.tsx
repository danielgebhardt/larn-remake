import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DungeonLayout from "../DungeonLayout.tsx";
import { START_COORDINATE, startingDungeon } from "../LayoutTiles.ts";

describe("DungeonLayout Tests", () => {
	it("renders a simple 5 x 5 dungeon by default", () => {
		render(
			<DungeonLayout
				dungeon={startingDungeon}
				playerPosition={START_COORDINATE}
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
				dungeon={startingDungeon}
				playerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			"@",
		);
	});
});
