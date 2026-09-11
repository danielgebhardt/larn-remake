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
