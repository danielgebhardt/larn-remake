import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "../Home.tsx";

describe("App Banner tests", () => {
	it("should show the Header and main elements", () => {
		render(<Home />);

		expect(
			screen.getByRole("heading", { name: "Larn Remake" }),
		).toHaveTextContent("Larn Remake");

		expect(screen.getByRole("main")).toBeVisible();
	});
});
