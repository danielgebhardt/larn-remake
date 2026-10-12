import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";
import VisibleEffects from "../components/game/VisibleEffects";

it("warns on visible area tiles without revealing remembered neighbors", () => {
	render(
		<DungeonLayout
			dungeon={[[".", ".", ".", "."]]}
			playerPosition={{ row: 0, col: 2 }}
			onMoveRequested={vi.fn()}
			visible={[[true, false, true, false]]}
			explored={[[true, true, true, true]]}
			monsters={[
				{
					id: "1:1",
					kind: "salamander",
					floorNumber: 1,
					coordinate: { row: 0, col: 0 },
					health: 24,
					intent: {
						type: "preparing-area",
						target: { row: 0, col: 2 },
						radius: 1,
						element: "fire",
						remaining: 2,
					},
				},
			]}
		/>,
	);
	expect(screen.getByRole("cell", { name: /row0col2/ })).toHaveAccessibleName(
		/prepared area attack/,
	);
	expect(
		screen.getByRole("cell", { name: /row0col1/ }),
	).not.toHaveAccessibleName(/prepared area attack/);
	expect(
		screen.getByRole("cell", { name: /row0col3/ }),
	).not.toHaveAccessibleName(/prepared area attack/);
});

it("shows the response countdown only for a currently visible source", () => {
	const actor = {
		id: "1:1",
		kind: "salamander" as const,
		floorNumber: 1,
		coordinate: { row: 0, col: 0 },
		health: 24,
		intent: {
			type: "preparing-area" as const,
			target: { row: 0, col: 2 },
			radius: 1 as const,
			element: "fire" as const,
			remaining: 2,
		},
	};
	const { rerender } = render(
		<VisibleEffects effects={[]} monsters={[actor]} visible={[[true]]} />,
	);
	expect(screen.getByLabelText("Incoming area attacks")).toHaveTextContent(
		"2 response turns left",
	);
	rerender(
		<VisibleEffects effects={[]} monsters={[actor]} visible={[[false]]} />,
	);
	expect(
		screen.queryByLabelText("Incoming area attacks"),
	).not.toBeInTheDocument();
});
