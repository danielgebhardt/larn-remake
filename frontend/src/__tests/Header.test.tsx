import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Header from "../Header.tsx";

describe("Header tests", () => {
	it("should show the header", () => {
		render(<Header />);

		expect(
			screen.getByRole("heading", { name: "Larn Remake" }),
		).toHaveTextContent("Larn Remake");
	});
});
