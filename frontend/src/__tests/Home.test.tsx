import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../Home.tsx";

describe("Home tests", () => {
	it("should show the Header and main elements", () => {
		render(<Home />);

		expect(
			screen.getByRole("heading", { name: "Larn Remake" }),
		).toHaveTextContent("Larn Remake");

		expect(screen.getByRole("main")).toBeVisible();
	});

	it("should show the default 5 x 5 dungeon layout", () => {
		render(<Home />);

		expect(screen.getByRole("table", { name: "Dungeon" })).toBeVisible();
	});

	it("it should show walls and floors in the correct individual grid location", () => {
		render(<Home />);

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
