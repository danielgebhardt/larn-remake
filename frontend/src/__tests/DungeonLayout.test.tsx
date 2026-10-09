import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, useState } from "react";
import { describe, expect, it, vi } from "vitest";
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

const noopPlayerMove = () => {};

// Model a parent accepting valid movement requests from the controlled layout.
const TestDungeonLayout = ({
	playerPosition: initialPosition,
	onPlayerMove,
	...props
}: ComponentProps<typeof DungeonLayout>) => {
	const [playerPosition, setPlayerPosition] = useState(initialPosition);

	return (
		<DungeonLayout
			{...props}
			playerPosition={playerPosition}
			onPlayerMove={(coordinate) => {
				setPlayerPosition(coordinate);
				onPlayerMove(coordinate);
			}}
		/>
	);
};

describe("DungeonLayout tests", () => {
	it("keeps the supplied position until the parent accepts a movement request", async () => {
		const onPlayerMove = vi.fn();
		const { rerender } = render(
			<DungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 1 }}
				onPlayerMove={onPlayerMove}
			/>,
		);

		await userEvent.keyboard("{ArrowRight}");

		expect(onPlayerMove).toHaveBeenCalledExactlyOnceWith({ row: 1, col: 2 });
		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();

		rerender(
			<DungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 2 }}
				onPlayerMove={onPlayerMove}
			/>,
		);

		await userEvent.keyboard("{ArrowLeft}");

		expect(onPlayerMove).toHaveBeenCalledTimes(2);
		expect(onPlayerMove).toHaveBeenLastCalledWith({ row: 1, col: 1 });
		expect(
			screen.getByRole("cell", { name: "row1col2 - player" }),
		).toBeVisible();
	});

	it("renders a parent position update on the same floor without remounting", () => {
		const onPlayerMove = vi.fn();
		const { rerender } = render(
			<DungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 1 }}
				onPlayerMove={onPlayerMove}
			/>,
		);

		rerender(
			<DungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 2 }}
				onPlayerMove={onPlayerMove}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col2 - player" }),
		).toBeVisible();
		expect(
			screen.getByRole("cell", { name: "row1col1 - floor" }),
		).toBeVisible();
		expect(onPlayerMove).not.toHaveBeenCalled();
	});

	describe("Dungeon keyboard browser behavior", () => {
		it.each(movementKeys)(
			"prevents the default action of $key while moving the player",
			({ key, row, col }) => {
				render(
					<TestDungeonLayout
						dungeon={openDungeon}
						playerPosition={{ row: 1, col: 1 }}
						onPlayerMove={noopPlayerMove}
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
						onPlayerMove={noopPlayerMove}
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
					onPlayerMove={noopPlayerMove}
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
								onPlayerMove={noopPlayerMove}
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
						onPlayerMove={noopPlayerMove}
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

	describe("DungeonLayout Tests", () => {
		it("provides a focusable map region for keyboard scrolling", () => {
			render(
				<DungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 0, col: 0 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);
			const map = screen.getByRole("region", { name: "Dungeon map" });
			expect(map).toHaveAttribute("tabindex", "0");
			map.focus();
			expect(map).toHaveFocus();
		});
		it.each([
			{ tile: FLOOR, description: "floor", icons: 1 },
			{ tile: PLAYER, description: "player", icons: 1 },
			{ tile: STAIRS_UP, description: "stairs up", icons: 1 },
			{ tile: STAIRS_DOWN, description: "stairs down", icons: 1 },
		])(
			"renders $description with decorative SVGs instead of a glyph",
			({ tile, description, icons }) => {
				render(
					<DungeonLayout
						dungeon={openDungeon}
						playerPosition={
							tile === PLAYER ? { row: 1, col: 1 } : { row: 0, col: 0 }
						}
						upStair={tile === STAIRS_UP ? { row: 1, col: 1 } : undefined}
						downStair={tile === STAIRS_DOWN ? { row: 1, col: 1 } : undefined}
						onPlayerMove={noopPlayerMove}
					/>,
				);
				const cell = screen.getByRole("cell", {
					name: `row1col1 - ${description}`,
				});
				expect(cell).not.toHaveTextContent(tile);
				const svgs = cell.querySelectorAll("svg");
				expect(svgs).toHaveLength(icons);
				for (const svg of svgs) {
					expect(svg).toHaveAttribute("aria-hidden", "true");
					expect(svg).toHaveAttribute("focusable", "false");
				}
			},
		);
		it("renders a simple 5 x 5 dungeon by default", () => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={START_COORDINATE}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			const wall = screen.getByRole("cell", { name: "row0col0 - wall" });
			expect(wall).not.toHaveTextContent(WALL);
			expect(wall.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
			expect(wall.querySelector("svg")).toHaveAttribute("focusable", "false");
			expect(
				screen.getByRole("cell", { name: "row1col0 - wall" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "row1col3 - floor" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "row1col2 - floor" }),
			).toBeVisible();
			expect(
				screen.getByRole("cell", { name: "row4col4 - wall" }),
			).toBeVisible();
		});

		it("should start with Player in 1,1 position by default", () => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={START_COORDINATE}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();
		});

		it("should move player down and up when pressing Up, Down, 's', and 'w' keys", async () => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={START_COORDINATE}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowDown}");

			expect(
				screen.getByRole("cell", { name: "row2col1 - player" }),
			).toBeVisible();

			expect(
				screen.getByRole("cell", { name: "row1col1 - floor" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowUp}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			expect(
				screen.getByRole("cell", { name: "row2col1 - floor" }),
			).toBeVisible();

			await userEvent.keyboard("s");

			expect(
				screen.getByRole("cell", { name: "row2col1 - player" }),
			).toBeVisible();

			expect(
				screen.getByRole("cell", { name: "row1col1 - floor" }),
			).toBeVisible();

			await userEvent.keyboard("w");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			expect(
				screen.getByRole("cell", { name: "row2col1 - floor" }),
			).toBeVisible();
		});

		it("should move player right and left when pressing Right, Left, 'd', and 'a' keys", async () => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={START_COORDINATE}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row1col2 - player" }),
			).toBeVisible();

			expect(
				screen.getByRole("cell", { name: "row1col1 - floor" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowLeft}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			expect(
				screen.getByRole("cell", { name: "row1col2 - floor" }),
			).toBeVisible();

			await userEvent.keyboard("d");

			expect(
				screen.getByRole("cell", { name: "row1col2 - player" }),
			).toBeVisible();

			expect(
				screen.getByRole("cell", { name: "row1col1 - floor" }),
			).toBeVisible();

			await userEvent.keyboard("a");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			expect(
				screen.getByRole("cell", { name: "row1col2 - floor" }),
			).toBeVisible();
		});

		it("should not let player move into a wall when moving left or up", async () => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={START_COORDINATE}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowUp}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowLeft}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();
		});

		it("should not let player move into a wall when moving right or down", async () => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={{ row: 3, col: 3 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row3col3 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowDown}");

			expect(
				screen.getByRole("cell", { name: "row3col3 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row3col3 - player" }),
			).toBeVisible();
		});

		it("should not allow player to move out of bounds for moving left or up", async () => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={{ row: 0, col: 0 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row0col0 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowUp}");

			expect(
				screen.getByRole("cell", { name: "row0col0 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowLeft}");

			expect(
				screen.getByRole("cell", { name: "row0col0 - player" }),
			).toBeVisible();
		});

		it("should not allow player to move out of bounds for moving right or down", async () => {
			render(
				<TestDungeonLayout
					dungeon={fixedDungeon}
					playerPosition={{ row: 4, col: 4 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row4col4 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowDown}");

			expect(
				screen.getByRole("cell", { name: "row4col4 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row4col4 - player" }),
			).toBeVisible();
		});

		it("should not allow movement out of bounds in asymmetric dungeon", async () => {
			render(
				<TestDungeonLayout
					dungeon={[
						[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
						[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
						[FLOOR, FLOOR, FLOOR, FLOOR, FLOOR],
					]}
					playerPosition={{ row: 1, col: 3 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col3 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row1col4 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row1col4 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowDown}");

			expect(
				screen.getByRole("cell", { name: "row2col4 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowDown}");

			expect(
				screen.getByRole("cell", { name: "row2col4 - player" }),
			).toBeVisible();
		});

		it("moves from a room through a corridor into another room", async () => {
			render(
				<TestDungeonLayout
					dungeon={connectedDungeon}
					playerPosition={{ row: 2, col: 2 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			await userEvent.keyboard("{ArrowRight}");
			expect(
				screen.getByRole("cell", { name: "row2col3 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowRight}{ArrowRight}{ArrowRight}");
			expect(
				screen.getByRole("cell", { name: "row2col6 - player" }),
			).toBeVisible();
		});

		it("blocks movement from a corridor into a wall", async () => {
			render(
				<TestDungeonLayout
					dungeon={connectedDungeon}
					playerPosition={{ row: 2, col: 4 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col4 - wall" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowUp}");

			expect(
				screen.getByRole("cell", { name: "row2col4 - player" }),
			).toBeVisible();
		});

		it("calls onPlayerMove with the new coordinate after a valid move", async () => {
			const onPlayerMove = vi.fn();

			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 1, col: 1 }}
					onPlayerMove={onPlayerMove}
				/>,
			);

			await userEvent.keyboard("{ArrowRight}");

			expect(onPlayerMove).toHaveBeenCalledTimes(1);
			expect(onPlayerMove).toHaveBeenCalledWith({
				row: 1,
				col: 2,
			});
		});

		it("does not call onPlayerMove when movement is blocked", async () => {
			const onPlayerMove = vi.fn();

			render(
				<TestDungeonLayout
					dungeon={[
						[WALL, WALL, WALL],
						[WALL, FLOOR, WALL],
						[WALL, WALL, WALL],
					]}
					playerPosition={{ row: 1, col: 1 }}
					onPlayerMove={onPlayerMove}
				/>,
			);

			await userEvent.keyboard("{ArrowRight}");

			expect(onPlayerMove).not.toHaveBeenCalled();
		});
	});

	describe("Stair tests", () => {
		it("renders a down stair marker on the supplied stair coordinate", () => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 0, col: 0 }}
					downStair={{ row: 1, col: 1 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs down" }),
			).toBeVisible();
		});

		it("renders an up stair marker on the supplied stair coordinate", () => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 0, col: 0 }}
					upStair={{ row: 1, col: 1 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs up" }),
			).toBeVisible();
		});

		it("renders the player instead of a down stair when occupying the same coordinate", () => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 1, col: 1 }}
					downStair={{ row: 1, col: 1 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();
		});

		it("allows the player to occupy a down stair and restores the marker after moving away", async () => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 1, col: 1 }}
					downStair={{ row: 1, col: 1 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs down" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowLeft}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();
		});

		it("renders the player instead of an up stair when occupying the same coordinate", () => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 1, col: 1 }}
					upStair={{ row: 1, col: 1 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();
		});

		it("allows the player to occupy an up stair and restores the marker after moving away", async () => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 1, col: 1 }}
					upStair={{ row: 1, col: 1 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowRight}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - stairs up" }),
			).toBeVisible();

			await userEvent.keyboard("{ArrowLeft}");

			expect(
				screen.getByRole("cell", { name: "row1col1 - player" }),
			).toBeVisible();
		});

		it("provides an accessible description for a down stair", () => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 0, col: 0 }}
					downStair={{ row: 1, col: 1 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			const stairCell = screen.getByRole("cell", {
				name: "row1col1 - stairs down",
			});

			expect(stairCell).toBeVisible();
		});

		it("provides an accessible description for an up stair", () => {
			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 0, col: 0 }}
					upStair={{ row: 1, col: 1 }}
					onPlayerMove={noopPlayerMove}
				/>,
			);

			const stairCell = screen.getByRole("cell", {
				name: "row1col1 - stairs up",
			});

			expect(stairCell).toBeVisible();
		});

		it("reports movement onto an up stair through onPlayerMove", async () => {
			const onPlayerMove = vi.fn();

			render(
				<TestDungeonLayout
					dungeon={openDungeon}
					playerPosition={{ row: 1, col: 2 }}
					upStair={{ row: 1, col: 1 }}
					onPlayerMove={onPlayerMove}
				/>,
			);

			await userEvent.keyboard("{ArrowLeft}");

			expect(onPlayerMove).toHaveBeenCalledTimes(1);
			expect(onPlayerMove).toHaveBeenCalledWith({
				row: 1,
				col: 1,
			});
		});
	});
});
