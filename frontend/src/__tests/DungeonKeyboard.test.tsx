import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, useState } from "react";
import { describe, expect, it } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout.tsx";
import {
	type DungeonRun,
	moveDungeonRun,
} from "../domain/dungeon/DungeonRun.ts";
import { FLOOR } from "../domain/dungeon/Tiles.ts";
import { fixedDungeon } from "./testhelpers.ts";

const movementKeys = [
	{ key: "ArrowUp", row: 0, col: 1 },
	{ key: "w", row: 0, col: 1 },
	{ key: "ArrowDown", row: 2, col: 1 },
	{ key: "s", row: 2, col: 1 },
	{ key: "ArrowLeft", row: 1, col: 0 },
	{ key: "a", row: 1, col: 0 },
	{ key: "ArrowRight", row: 1, col: 2 },
	{ key: "d", row: 1, col: 2 },
];

const openDungeon = [
	[FLOOR, FLOOR, FLOOR],
	[FLOOR, FLOOR, FLOOR],
	[FLOOR, FLOOR, FLOOR],
];

const noopMoveRequested = () => {};

const TestDungeonLayout = ({
	playerPosition: initialPosition,
	onMoveRequested,
	...props
}: ComponentProps<typeof DungeonLayout>) => {
	const [run, setRun] = useState<DungeonRun>(() => ({
		seed: 0,
		activeFloor: 1,
		playerCoordinate: initialPosition,
		floors: [
			{
				floorNumber: 1,
				terrain: props.dungeon,
				rooms: [],
				corridors: [],
				partitions: {
					region: {
						startRow: 0,
						endRow: props.dungeon.length - 1,
						startCol: 0,
						endCol: (props.dungeon[0]?.length ?? 0) - 1,
					},
				},
			},
		],
	}));

	return (
		<DungeonLayout
			{...props}
			playerPosition={run.playerCoordinate}
			onMoveRequested={(direction) => {
				setRun((current) => moveDungeonRun(current, direction));
				onMoveRequested(direction);
			}}
		/>
	);
};

describe("Dungeon keyboard input", () => {
	it.each(movementKeys)(
		"prevents the default action of $key while moving the player",
		({ key, row, col }) => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 1, col: 1 }}
					onMoveRequested={noopMoveRequested}
				/>,
			);

			const event = createEvent.keyDown(window, { key, cancelable: true });
			fireEvent(window, event);

			expect(
				screen.getByRole("cell", { name: `row${row}col${col} - player` }),
			).toBeVisible();
			expect(event.defaultPrevented).toBe(true);
		},
	);

	it.each([
		{ key: "ArrowUp", row: 1, col: 1 },
		{ key: "ArrowLeft", row: 1, col: 1 },
		{ key: "ArrowDown", row: 3, col: 3 },
		{ key: "ArrowRight", row: 3, col: 3 },
	])(
		"prevents the default action of $key even at a wall",
		({ key, row, col }) => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={{ row, col }}
					onMoveRequested={noopMoveRequested}
				/>,
			);

			const event = createEvent.keyDown(window, { key, cancelable: true });
			fireEvent(window, event);

			expect(
				screen.getByRole("cell", { name: `row${row}col${col} - player` }),
			).toBeVisible();
			expect(event.defaultPrevented).toBe(true);
		},
	);

	it("leaves an unrelated key's default action and player position unchanged", () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		const event = createEvent.keyDown(window, {
			key: "Tab",
			cancelable: true,
		});
		fireEvent(window, event);

		expect(event.defaultPrevented).toBe(false);
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
	});

	describe.each([
		{ name: "text input", editor: <input aria-label="Editor" /> },
		{ name: "textarea", editor: <textarea aria-label="Editor" /> },
		{
			name: "contenteditable element",
			editor: (
				// biome-ignore lint/a11y/useSemanticElements: This fixture specifically exercises contenteditable, not a native input.
				<div
					role="textbox"
					aria-label="Editor"
					contentEditable
					suppressContentEditableWarning
					tabIndex={0}
				/>
			),
		},
		{
			name: "child inside a contenteditable element",
			editor: (
				// biome-ignore lint/a11y/useSemanticElements: This fixture exercises events from a child of a contenteditable element.
				<div
					role="textbox"
					aria-label="Editor"
					contentEditable
					suppressContentEditableWarning
					tabIndex={0}
				>
					<span>Editable child</span>
				</div>
			),
		},
	])("with focus in a $name", ({ editor }) => {
		it.each(movementKeys)(
			"leaves $key to the editor without moving the player",
			({ key }) => {
				render(
					<>
						{editor}
						<TestDungeonLayout
							dungeon={openDungeon}
							playerPosition={{ row: 1, col: 1 }}
							onMoveRequested={noopMoveRequested}
						/>
					</>,
				);

				const editable = screen.getByRole("textbox", { name: "Editor" });
				editable.focus();
				expect(editable).toHaveFocus();
				const target = screen.queryByText("Editable child") ?? editable;
				if (editable.hasAttribute("contenteditable")) {
					// jsdom does not implement isContentEditable. In a browser,
					// both this editor and its child inherit effective editability.
					Object.defineProperty(target, "isContentEditable", { value: true });
				}
				const event = createEvent.keyDown(target, {
					key,
					bubbles: true,
					cancelable: true,
				});
				fireEvent(target, event);

				expect(event.defaultPrevented).toBe(false);
				expect(
					screen.getByRole("cell", { name: "row1col1 - player" }),
				).toBeVisible();
			},
		);
	});

	it.each([
		{ name: "text input", editor: <input aria-label="Editor" /> },
		{ name: "textarea", editor: <textarea aria-label="Editor" /> },
	])("allows typing a movement letter into a $name", async ({ editor }) => {
		const user = userEvent.setup();
		render(
			<>
				{editor}
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 1, col: 1 }}
					onMoveRequested={noopMoveRequested}
				/>
			</>,
		);

		const editable = screen.getByRole("textbox", { name: "Editor" });
		await user.type(editable, "d");

		expect(editable).toHaveValue("d");
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
	});
});
