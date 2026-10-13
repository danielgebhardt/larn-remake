import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import QuestStatus from "../components/game/QuestStatus";

const quest = {
	goalFloor: 20,
	entrance: { row: 1, col: 1 },
	cureRecovered: true,
	victory: null,
};
describe("Return journey progress", () => {
	it("shows the remaining ascent alongside the existing objective", () => {
		render(<QuestStatus quest={quest} activeFloor={4} />);
		expect(screen.getByLabelText("Quest objective")).toHaveTextContent(
			"3 floors to climb",
		);
		expect(screen.getByLabelText("Quest objective")).toHaveTextContent(
			"Return to the entrance on floor 1",
		);
	});
	it("directs the player to the entrance once on the surface floor", () => {
		render(<QuestStatus quest={quest} activeFloor={1} />);
		expect(screen.getByLabelText("Quest objective")).toHaveTextContent(
			"Reach the entrance on this floor",
		);
	});
});
