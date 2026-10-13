import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";

describe("Visible charge line", () => {
	it("marks visible path tiles and hides warnings when the source is unseen", () => {
		const actor = {
			id: "1:1",
			kind: "horned-charger" as const,
			floorNumber: 1,
			coordinate: { row: 0, col: 0 },
			health: 14,
			intent: { type: "preparing-charge" as const, target: { row: 0, col: 3 } },
		};
		const props = {
			dungeon: [[".", ".", ".", "."]],
			playerPosition: { row: 0, col: 3 },
			onMoveRequested: vi.fn(),
			monsters: [actor],
			explored: [[true, true, true, true]],
		};
		const { rerender } = render(
			<DungeonLayout {...props} visible={[[true, true, false, true]]} />,
		);
		expect(screen.getByRole("cell", { name: /row0col1/ })).toHaveAccessibleName(
			/prepared charge/,
		);
		expect(
			screen.getByRole("cell", { name: /row0col2/ }),
		).not.toHaveAccessibleName(/prepared charge/);
		rerender(
			<DungeonLayout {...props} visible={[[false, true, false, true]]} />,
		);
		expect(
			screen.getByRole("cell", { name: /row0col1/ }),
		).not.toHaveAccessibleName(/prepared charge/);
	});
});
