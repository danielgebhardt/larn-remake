import { type ReactNode, useCallback, useEffect } from "react";
import {
	type Coordinate,
	type Dungeon,
	getDungeonCoordinateValue,
	PLAYER,
	STAIRS_DOWN,
	STAIRS_UP,
	WALL,
} from "./LayoutTiles.ts";
import TileIcon from "./TileIcon.tsx";
import { TILE_BACKGROUNDS, TILE_LABELS } from "./TileVisuals.ts";

type DungeonLayoutProps = {
	dungeon: Dungeon;
	playerPosition: Coordinate;
	downStair?: Coordinate;
	upStair?: Coordinate;
	onPlayerMove: (coordinate: Coordinate) => void;
	movementEnabled?: boolean;
};

const DungeonLayout = ({
	dungeon,
	playerPosition,
	downStair,
	upStair,
	onPlayerMove,
	movementEnabled = true,
}: DungeonLayoutProps) => {
	const movePlayer = useCallback(
		(changeUpDown: number, changeLeftRight: number) => {
			const newRow = playerPosition.row + changeUpDown;
			const newCol = playerPosition.col + changeLeftRight;

			const isOutOfBounds =
				newRow < 0 ||
				newRow >= dungeon.length ||
				newCol < 0 ||
				newCol >= (dungeon[newRow]?.length ?? 0);

			if (isOutOfBounds) {
				return;
			}

			const coordinateValueInPositionToMoveTo = getDungeonCoordinateValue(
				newCol,
				newRow,
				dungeon,
			);

			if (coordinateValueInPositionToMoveTo === WALL) {
				return;
			}

			const nextCoordinate = {
				row: newRow,
				col: newCol,
			};

			onPlayerMove(nextCoordinate);
		},
		[dungeon, onPlayerMove, playerPosition],
	);

	useEffect(() => {
		if (!movementEnabled) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target instanceof HTMLElement && event.target.isContentEditable)
			) {
				return;
			}

			switch (event.key) {
				case "ArrowUp":
				case "w":
					event.preventDefault();
					movePlayer(-1, 0);
					break;

				case "ArrowDown":
				case "s":
					event.preventDefault();
					movePlayer(1, 0);
					break;

				case "ArrowLeft":
				case "a":
					event.preventDefault();
					movePlayer(0, -1);
					break;

				case "ArrowRight":
				case "d":
					event.preventDefault();
					movePlayer(0, 1);
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [movePlayer, movementEnabled]);

	const renderCell = (
		rowIndex: number,
		columnIndex: number,
		cell: string,
	): ReactNode => {
		let displayTile = cell;

		if (playerPosition.row === rowIndex && playerPosition.col === columnIndex) {
			displayTile = PLAYER;
		} else if (
			upStair &&
			upStair.row === rowIndex &&
			upStair.col === columnIndex
		) {
			displayTile = STAIRS_UP;
		} else if (
			downStair &&
			downStair.row === rowIndex &&
			downStair.col === columnIndex
		) {
			displayTile = STAIRS_DOWN;
		}
		const label = TILE_LABELS[displayTile];
		const tileDescription = `row${rowIndex}col${columnIndex}${label ? ` - ${label}` : ""}`;

		return (
			<td
				key={columnIndex}
				aria-label={tileDescription}
				className={`size-[24px] ${TILE_BACKGROUNDS[displayTile] ?? ""}`}
			>
				<TileIcon tile={displayTile} />
			</td>
		);
	};

	return (
		<section
			aria-label="Dungeon map"
			// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to focus the scrollable map region.
			tabIndex={0}
			className="max-h-[70vh] w-full overflow-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
		>
			<table aria-label="Dungeon" className="w-max border-collapse">
				<tbody className="grid">
					{dungeon.map((row, rowIndex) => (
						<tr
							key={rowIndex}
							className="grid"
							style={{
								gridTemplateColumns: `repeat(${row.length}, 24px)`,
							}}
						>
							{row.map((cell, columnIndex) =>
								renderCell(rowIndex, columnIndex, cell),
							)}
						</tr>
					))}
				</tbody>
			</table>
		</section>
	);
};

export default DungeonLayout;
