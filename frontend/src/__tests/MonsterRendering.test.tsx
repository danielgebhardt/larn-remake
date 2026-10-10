import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout.tsx";
import type { Monster } from "../domain/monsters/Monster.ts";
import { createTestDungeonFloor } from "./testhelpers.ts";

const goblin: Monster = {
	id: "1:1",
	kind: "goblin",
	floorNumber: 1,
	coordinate: { row: 1, col: 3 },
	health: 4,
};
const floor = createTestDungeonFloor({
	floorNumber: 1,
	rows: 3,
	cols: 5,
	room: { startRow: 1, endRow: 1, startCol: 1, endCol: 3 },
});
const mask = (seen: boolean) => floor.terrain.map((row) => row.map(() => seen));
const props = {
	dungeon: floor.terrain,
	playerPosition: { row: 1, col: 1 },
	onMoveRequested: vi.fn(),
	monsters: [goblin],
};

describe("Goblin map rendering", () => {
	it("shows multiple goblins in the same row and on a different row", () => {
		const dungeon = createTestDungeonFloor({
			floorNumber: 1,
			rows: 4,
			cols: 5,
			room: { startRow: 1, endRow: 2, startCol: 1, endCol: 3 },
		}).terrain;
		render(
			<DungeonLayout
				{...props}
				dungeon={dungeon}
				monsters={[
					goblin,
					{ ...goblin, id: "1:2", coordinate: { row: 1, col: 2 } },
					{ ...goblin, id: "1:3", coordinate: { row: 2, col: 3 } },
				]}
			/>,
		);
		expect(screen.getAllByLabelText(/goblin/)).toHaveLength(3);
		expect(screen.getByLabelText("row1col2 - goblin")).toBeVisible();
		expect(screen.getByLabelText("row2col3 - goblin")).toBeVisible();
	});

	it("shows a distinct SVG and accessible goblin label on a visible tile", () => {
		render(<DungeonLayout {...props} visible={mask(true)} />);
		const cell = screen.getByLabelText("row1col3 - goblin");
		expect(cell).toBeVisible();
		expect(cell.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
	});

	it("shows remembered terrain without a ghost goblin or monster label", () => {
		render(
			<DungeonLayout {...props} visible={mask(false)} explored={mask(true)} />,
		);
		expect(screen.getByLabelText("row1col3 - remembered floor")).toBeVisible();
		expect(screen.queryByLabelText(/goblin/)).not.toBeInTheDocument();
	});

	it("reveals neither terrain nor goblin on an undiscovered tile", () => {
		render(
			<DungeonLayout {...props} visible={mask(false)} explored={mask(false)} />,
		);
		expect(
			screen.getByLabelText("row1col3 - undiscovered").querySelector("svg"),
		).toBeNull();
		expect(screen.queryByLabelText(/goblin/)).not.toBeInTheDocument();
	});

	it("shows the goblin when fog is disabled and hides it again when fog resumes", () => {
		const { rerender } = render(<DungeonLayout {...props} />);
		expect(screen.getByLabelText("row1col3 - goblin")).toBeVisible();
		rerender(
			<DungeonLayout {...props} visible={mask(false)} explored={mask(true)} />,
		);
		expect(screen.queryByLabelText(/goblin/)).not.toBeInTheDocument();
	});
});
