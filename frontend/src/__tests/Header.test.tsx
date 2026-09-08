import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Header from "../Header.tsx";

describe("App Banner tests", () => {
	it("should show the App Banner", () => {
		render(<Header />);

		expect(
			screen.getByRole("heading", { name: "Larn Remake" }),
		).toHaveTextContent("Larn Remake");
	});
});
