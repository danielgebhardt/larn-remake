import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import DungeonLayout from "../DungeonLayout.tsx";
import {
	FLOOR,
	fixedDungeon,
	PLAYER,
	STAIRS_DOWN,
	STAIRS_UP,
	START_COORDINATE,
	WALL,
} from "../LayoutTiles.ts";

const connectedDungeon = [
	Array(9).fill(WALL),
	[WALL, FLOOR, FLOOR, WALL, WALL, WALL, FLOOR, FLOOR, WALL],
	[WALL, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, FLOOR, WALL],
	[WALL, FLOOR, FLOOR, WALL, WALL, WALL, FLOOR, FLOOR, WALL],
	Array(9).fill(WALL),
];

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

describe("Dungeon keyboard browser behavior", () => {
	it.each(movementKeys)(
		"prevents the default action of $key while moving the player",
		({ key, row, col }) => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 1, col: 1 }}
				/>,
			);

			const event = createEvent.keyDown(window, { key, cancelable: true });
			fireEvent(window, event);

			expect(
				screen.getByRole("cell", { name: `row${row}col${col} - player` }),
			).toHaveTextContent(PLAYER);
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
				<DungeonLayout
					dungeon={fixedDungeon}
					startingPlayerPosition={{ row, col }}
				/>,
			);

			const event = createEvent.keyDown(window, { key, cancelable: true });
			fireEvent(window, event);

			expect(
				screen.getByRole("cell", { name: `row${row}col${col} - player` }),
			).toHaveTextContent(PLAYER);
			expect(event.defaultPrevented).toBe(true);
		},
	);

	it("leaves an unrelated key's default action and player position unchanged", () => {
		render(
			<DungeonLayout
				dungeon={openDungeon}
				startingPlayerPosition={{ row: 1, col: 1 }}
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
		).toHaveTextContent(PLAYER);
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
						<DungeonLayout
							dungeon={openDungeon}
							startingPlayerPosition={{ row: 1, col: 1 }}
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
				).toHaveTextContent(PLAYER);
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
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 1, col: 1 }}
				/>
			</>,
		);

		const editable = screen.getByRole("textbox", { name: "Editor" });
		await user.type(editable, "d");

		expect(editable).toHaveValue("d");
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);
	});
});

describe("DungeonLayout Tests", () => {
	it("renders a simple 5 x 5 dungeon by default", () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row0col0" })).toHaveTextContent(
			"#",
		);
		expect(screen.getByRole("cell", { name: "row1col0" })).toHaveTextContent(
			"#",
		);
		expect(screen.getByRole("cell", { name: "row1col3" })).toHaveTextContent(
			".",
		);
		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			".",
		);
		expect(screen.getByRole("cell", { name: "row4col4" })).toHaveTextContent(
			"#",
		);
	});

	it("should start with Player in 1,1 position by default", () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);
	});

	it("should move player down and up when pressing Up, Down, 's', and 'w' keys", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowDown}");

		expect(
			screen.getByRole("cell", { name: "row2col1 - player" }),
		).toHaveTextContent(PLAYER);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("{ArrowUp}");

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);

		expect(screen.getByRole("cell", { name: "row2col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("s");

		expect(
			screen.getByRole("cell", { name: "row2col1 - player" }),
		).toHaveTextContent(PLAYER);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("w");

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);

		expect(screen.getByRole("cell", { name: "row2col1" })).toHaveTextContent(
			".",
		);
	});

	it("should move player right and left when pressing Right, Left, 'd', and 'a' keys", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", { name: "row1col2 - player" }),
		).toHaveTextContent(PLAYER);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("{ArrowLeft}");

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);

		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("d");

		expect(
			screen.getByRole("cell", { name: "row1col2 - player" }),
		).toHaveTextContent(PLAYER);

		expect(screen.getByRole("cell", { name: "row1col1" })).toHaveTextContent(
			".",
		);

		await userEvent.keyboard("a");

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);

		expect(screen.getByRole("cell", { name: "row1col2" })).toHaveTextContent(
			".",
		);
	});

	it("should not let player move into a wall when moving left or up", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={START_COORDINATE}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowUp}");

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowLeft}");

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toHaveTextContent(PLAYER);
	});

	it("should not let player move into a wall when moving right or down", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={{ row: 3, col: 3 }}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row3col3 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowDown}");

		expect(
			screen.getByRole("cell", { name: "row3col3 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", { name: "row3col3 - player" }),
		).toHaveTextContent(PLAYER);
	});

	it("should not allow player to move out of bounds for moving left or up", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={{ row: 0, col: 0 }}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row0col0 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowUp}");

		expect(
			screen.getByRole("cell", { name: "row0col0 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowLeft}");

		expect(
			screen.getByRole("cell", { name: "row0col0 - player" }),
		).toHaveTextContent(PLAYER);
	});

	it("should not allow player to move out of bounds for moving right or down", async () => {
		render(
			<DungeonLayout
				dungeon={fixedDungeon}
				startingPlayerPosition={{ row: 4, col: 4 }}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row4col4 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowDown}");

		expect(
			screen.getByRole("cell", { name: "row4col4 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", { name: "row4col4 - player" }),
		).toHaveTextContent(PLAYER);
	});

	it("should not allow movement out of bounds in asymmetric dungeon", async () => {
		render(
			<DungeonLayout
				dungeon={[
					[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
					[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
					[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
				]}
				startingPlayerPosition={{ row: 1, col: 3 }}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col3 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", { name: "row1col4 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", { name: "row1col4 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowDown}");

		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowDown}");

		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toHaveTextContent(PLAYER);
	});

	it("moves from a room through a corridor into another room", async () => {
		render(
			<DungeonLayout
				dungeon={connectedDungeon}
				startingPlayerPosition={{ row: 2, col: 2 }}
			/>,
		);

		await userEvent.keyboard("{ArrowRight}");
		expect(
			screen.getByRole("cell", { name: "row2col3 - player" }),
		).toHaveTextContent(PLAYER);

		await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
		expect(
			screen.getByRole("cell", { name: "row2col6 - player" }),
		).toHaveTextContent(PLAYER);
	});

	it("blocks movement from a corridor into a wall", async () => {
		render(
			<DungeonLayout
				dungeon={connectedDungeon}
				startingPlayerPosition={{ row: 2, col: 4 }}
			/>,
		);

		expect(screen.getByRole("cell", { name: "row1col4" })).toHaveTextContent(
			WALL,
		);

		await userEvent.keyboard("{ArrowUp}");

		expect(
			screen.getByRole("cell", { name: "row2col4 - player" }),
		).toHaveTextContent(PLAYER);
	});

	describe("Stair tests", () => {
		it("renders a down stair marker on the supplied stair coordinate", () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 0, col: 0 }}
					downStair={{ row: 1, col: 1 }}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs down" }),
			).toHaveTextContent(STAIRS_DOWN);
		});

		it("renders an up stair marker on the supplied stair coordinate", () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 0, col: 0 }}
					upStair={{ row: 1, col: 1 }}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs up" }),
			).toHaveTextContent(STAIRS_UP);
		});

		it("renders the player instead of a down stair when occupying the same coordinate", () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 1, col: 1 }}
					downStair={{ row: 1, col: 1 }}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toHaveTextContent(PLAYER);
		});

		it("allows the player to occupy a down stair and restores the marker after moving away", async () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 1, col: 1 }}
					downStair={{ row: 1, col: 1 }}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toHaveTextContent(PLAYER);

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs down" }),
			).toHaveTextContent(STAIRS_DOWN);

			await userEvent.keyboard("{ArrowLeft}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toHaveTextContent(PLAYER);
		});

		it("renders the player instead of an up stair when occupying the same coordinate", () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 1, col: 1 }}
					upStair={{ row: 1, col: 1 }}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toHaveTextContent(PLAYER);
		});

		it("allows the player to occupy an up stair and restores the marker after moving away", async () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 1, col: 1 }}
					upStair={{ row: 1, col: 1 }}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toHaveTextContent(PLAYER);

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs up" }),
			).toHaveTextContent(STAIRS_UP);

			await userEvent.keyboard("{ArrowLeft}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toHaveTextContent(PLAYER);
		});

		it("provides an accessible description for a down stair", () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 0, col: 0 }}
					downStair={{ row: 1, col: 1 }}
				/>,
			);

			const stairCell = screen.getByRole("cell", {
				name: "row1col1 - stairs down",
			});

			expect(stairCell).toHaveTextContent(STAIRS_DOWN);
		});

		it("provides an accessible description for an up stair", () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					startingPlayerPosition={{ row: 0, col: 0 }}
					upStair={{ row: 1, col: 1 }}
				/>,
			);

			const stairCell = screen.getByRole("cell", {
				name: "row1col1 - stairs up",
			});

			expect(stairCell).toHaveTextContent(STAIRS_UP);
		});
	});
});
