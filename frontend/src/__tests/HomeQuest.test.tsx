import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import Home from "../Home";
import { ThemeProvider } from "../settings/ThemeProvider";
import { resetHomeTestState, stubDungeonRun } from "./HomeTestHelpers";
import { createThreeFloorTraversalRun } from "./testhelpers";

afterEach(resetHomeTestState);
describe("Visible adventure objective", () => {
	it.each(["keyboard", "Character"])(
		"recovers through %s and shows the protected pouch",
		async (method) => {
			const run = { ...createThreeFloorTraversalRun(), activeFloor: 3 };
			stubDungeonRun(
				run,
				[],
				[
					{
						item: { id: "quest:cure", kind: "cure" },
						floorNumber: 3,
						coordinate: { row: 1, col: 2 },
					},
				],
			);
			render(<Home />, { wrapper: ThemeProvider });
			const user = userEvent.setup();
			expect(screen.getByLabelText("Quest objective")).toHaveTextContent(
				"Recover the cure on floor 3",
			);
			await user.keyboard("d");
			if (method === "keyboard") await user.keyboard("g");
			else {
				await user.click(screen.getByRole("button", { name: "Character" }));
				await user.click(
					screen.getByRole("button", { name: "Pick up Cure, item 1" }),
				);
				await user.keyboard("{Escape}");
			}
			expect(screen.getByLabelText("Quest objective")).toHaveTextContent(
				"Return to the entrance on floor 1",
			);
			expect(screen.getByRole("log")).toHaveTextContent("You recover the cure");
			await user.click(screen.getByRole("button", { name: "Character" }));
			const panel = within(
				await screen.findByRole("dialog", { name: "Character" }),
			);
			expect(panel.getByLabelText("Quest pouch")).toHaveTextContent(
				"Cure protected",
			);
			expect(panel.getByLabelText("Bag capacity")).toHaveTextContent("2 / 20");
			expect(
				panel.queryByRole("button", { name: /Drink cure|Drop cure/ }),
			).not.toBeInTheDocument();
		},
	);
});
