import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { describe, expect, it } from "vitest";
import App from "../App.tsx";
import { server } from "../mocks/server.ts";

describe("App", () => {
	it("should render the title from the backend", async () => {
		render(<App />);

		expect(
			await screen.findByRole("heading", { name: "App Heading" }),
		).toHaveTextContent("Hello World!");
	});

	it("renders an error message when the API fails", async () => {
		server.use(
			http.get("/initial", () => {
				return new HttpResponse(null, { status: 500 });
			}),
		);

		render(<App />);

		const errorMessage = await screen.findByRole("alert");
		expect(errorMessage).toHaveTextContent("Failed to load from server");
	});
});
