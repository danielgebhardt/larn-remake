import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DungeonLayout from "../DungeonLayout.tsx";

describe("DungeonLayout Tests", () => {
	it("renders a simple 5 x 5 dungeon by default", () => {
		render(<DungeonLayout />);

		expect(screen.getByRole("cell", { name: "row0cell0" })).toHaveTextContent(
			"#####",
		);
		expect(screen.getByRole("cell", { name: "row1cell0" })).toHaveTextContent(
			"#...#",
		);
		expect(screen.getByRole("cell", { name: "row2cell0" })).toHaveTextContent(
			"#.#.#",
		);
		expect(screen.getByRole("cell", { name: "row3cell0" })).toHaveTextContent(
			"#...#",
		);
		expect(screen.getByRole("cell", { name: "row4cell0" })).toHaveTextContent(
			"#####",
		);
	});
});
