import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DungeonLayout from "../DungeonLayout.tsx";

describe("DungeonLayout Tests", () => {
	it("renders a simple 5 x 5 dungeon by default", () => {
		render(<DungeonLayout />);

		expect(screen.getByRole("cell", { name: "row0col0" })).toHaveTextContent(
			"#",
		);
		expect(screen.getByRole("cell", { name: "row1col0" })).toHaveTextContent(
			"#",
		);
		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);
		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			".",
		);
		expect(screen.getByRole("cell", { name: "row4col4" })).toHaveTextContent(
			"#",
		);
	});
});
