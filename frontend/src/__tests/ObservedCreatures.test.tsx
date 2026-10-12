import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import ObservedCreatures from "../components/monsters/ObservedCreatures";

it("explains currently visible traits without listing hidden creatures", () => {
	render(
		<ObservedCreatures
			visible={[[true, false]]}
			monsters={[
				{
					id: "1:1",
					kind: "salamander",
					floorNumber: 1,
					coordinate: { row: 0, col: 0 },
					health: 24,
					intent: { type: "idle" },
				},
				{
					id: "1:2",
					kind: "necromancer",
					floorNumber: 1,
					coordinate: { row: 0, col: 1 },
					health: 28,
					intent: { type: "idle" },
				},
			]}
		/>,
	);
	expect(screen.getByRole("heading", { name: "salamander" })).toBeVisible();
	expect(screen.getByText(/Resists fire/)).toBeVisible();
	expect(screen.getByText(/Weak to cold/)).toBeVisible();
	expect(screen.getByText(/2 response turns/)).toBeVisible();
	expect(
		screen.queryByRole("heading", { name: "necromancer" }),
	).not.toBeInTheDocument();
});
