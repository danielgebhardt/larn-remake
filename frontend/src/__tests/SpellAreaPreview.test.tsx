import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";

it("shows the spell footprint only on currently visible tiles", () => {
	render(
		<DungeonLayout
			onMoveRequested={vi.fn()}
			dungeon={[[".", ".", "."]]}
			playerPosition={{ row: 0, col: 0 }}
			visible={[[true, false, true]]}
			explored={[[true, true, true]]}
			spellArea={[
				{ row: 0, col: 1 },
				{ row: 0, col: 2 },
			]}
		/>,
	);
	expect(screen.getByRole("cell", { name: /row0col2/ })).toHaveAccessibleName(
		/spell area/,
	);
	expect(
		screen.getByRole("cell", { name: /row0col1/ }),
	).not.toHaveAccessibleName(/spell area/);
});
