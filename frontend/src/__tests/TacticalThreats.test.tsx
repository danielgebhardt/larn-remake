import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";
import type { Monster } from "../domain/monsters/Monster";
import { createTestDungeonFloor } from "./testhelpers";

const terrain = createTestDungeonFloor({
	floorNumber: 1,
	rows: 5,
	cols: 6,
	room: { startRow: 1, endRow: 3, startCol: 1, endCol: 4 },
}).terrain;
const brute: Monster = {
	id: "1:1",
	kind: "dungeon-brute",
	floorNumber: 1,
	coordinate: { row: 3, col: 2 },
	health: 10,
	intent: { type: "preparing-attack", target: { row: 2, col: 2 } },
};
const mask = (seen: boolean) => terrain.map((row) => row.map(() => seen));
const props = {
	dungeon: terrain,
	playerPosition: { row: 2, col: 2 },
	monsters: [brute],
	onMoveRequested: vi.fn(),
};

describe("Prepared attack map cues", () => {
	it("retains a floor item's label and SVG underneath the cue", () => {
		render(
			<DungeonLayout
				{...props}
				playerPosition={{ row: 1, col: 1 }}
				floorItems={[
					{
						item: { id: "floor:shield", kind: "wooden-shield" },
						floorNumber: 1,
						coordinate: { row: 2, col: 2 },
					},
				]}
			/>,
		);
		const target = screen.getByLabelText(
			"row2col2 - Wooden shield - prepared heavy attack",
		);
		expect(target.querySelector("svg")).toBeInTheDocument();
	});

	it("keeps a selected monster target clickable underneath the warning", async () => {
		const cast = vi.fn();
		const archer: Monster = {
			...brute,
			id: "1:2",
			kind: "goblin-archer",
			coordinate: { row: 2, col: 2 },
			health: 5,
			intent: { type: "idle" },
		};
		render(
			<DungeonLayout
				{...props}
				playerPosition={{ row: 1, col: 1 }}
				monsters={[brute, archer]}
				targetIds={[archer.id]}
				selectedTargetId={archer.id}
				onTargetRequested={cast}
			/>,
		);
		const target = screen.getByRole("button", {
			name: "Target goblin archer at row 2, column 2",
		});
		expect(target).toHaveAttribute("aria-pressed", "true");
		expect(
			screen.getByLabelText("row2col2 - goblin archer - prepared heavy attack"),
		).toBeVisible();
		await userEvent.setup().click(target);
		expect(cast).toHaveBeenCalledExactlyOnceWith(archer.id);
	});

	it("marks the visible fixed target while retaining the player SVG", () => {
		render(<DungeonLayout {...props} visible={mask(true)} />);
		const target = screen.getByRole("cell", {
			name: "row2col2 - player - prepared heavy attack",
		});
		expect(target).toHaveAttribute(
			"title",
			"Prepared heavy attack: move away to dodge.",
		);
		expect(target.querySelector("svg")).toBeInTheDocument();
		expect(
			screen.getByRole("cell", { name: "row3col2 - dungeon brute" }),
		).toBeVisible();
	});

	it.each(["remembered", "undiscovered"])(
		"hides intent from a %s monster even when the target is the visible player",
		(visibility) => {
			const visible = mask(true);
			visible[3][2] = false;
			render(
				<DungeonLayout
					{...props}
					visible={visible}
					explored={mask(visibility === "remembered")}
				/>,
			);
			expect(
				screen.getByRole("cell", { name: "row2col2 - player" }),
			).toBeVisible();
			expect(
				screen.queryByLabelText(/prepared heavy attack/),
			).not.toBeInTheDocument();
			expect(screen.queryByLabelText(/dungeon brute/)).not.toBeInTheDocument();
		},
	);

	it.each(["remembered", "undiscovered"])(
		"does not mark a %s target of a visible monster",
		(visibility) => {
			const visible = mask(true);
			visible[2][2] = false;
			render(
				<DungeonLayout
					{...props}
					playerPosition={{ row: 1, col: 1 }}
					visible={visible}
					explored={mask(visibility === "remembered")}
				/>,
			);
			expect(
				screen.queryByLabelText(/prepared heavy attack/),
			).not.toBeInTheDocument();
		},
	);

	it("removes the marker when intent clears or its source dies", () => {
		const { rerender } = render(<DungeonLayout {...props} />);
		expect(screen.getByLabelText(/prepared heavy attack/)).toBeVisible();
		rerender(
			<DungeonLayout
				{...props}
				monsters={[{ ...brute, intent: { type: "idle" } }]}
			/>,
		);
		expect(
			screen.queryByLabelText(/prepared heavy attack/),
		).not.toBeInTheDocument();
		rerender(<DungeonLayout {...props} monsters={[{ ...brute, health: 0 }]} />);
		expect(
			screen.queryByLabelText(/prepared heavy attack/),
		).not.toBeInTheDocument();
	});

	it("follows the stored target rather than the player's new position", () => {
		render(<DungeonLayout {...props} playerPosition={{ row: 1, col: 1 }} />);
		expect(
			screen.getByLabelText("row2col2 - floor - prepared heavy attack"),
		).toBeVisible();
		expect(screen.getByLabelText("row1col1 - player")).toBeVisible();
	});

	it("retains stair symbols underneath the cue", () => {
		render(
			<DungeonLayout
				{...props}
				playerPosition={{ row: 1, col: 1 }}
				downStair={{ row: 2, col: 2 }}
			/>,
		);
		const target = screen.getByLabelText(
			"row2col2 - stairs down - prepared heavy attack",
		);
		expect(target.querySelector("svg")).toBeInTheDocument();
	});

	it("deduplicates overlapping threats on the same tile", () => {
		render(
			<DungeonLayout
				{...props}
				monsters={[
					brute,
					{ ...brute, id: "1:2", coordinate: { row: 2, col: 3 } },
				]}
			/>,
		);
		expect(screen.getAllByLabelText(/prepared heavy attack/)).toHaveLength(1);
	});
});
