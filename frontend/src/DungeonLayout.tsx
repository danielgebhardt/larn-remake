import { type ReactNode, useCallback, useEffect, useState } from "react";
import {
	type Coordinate,
	type Dungeon,
	getDungeonCoordinateValue,
	PLAYER,
	STAIRS_DOWN,
	STAIRS_UP,
	WALL,
} from "./LayoutTiles.ts";

type DungeonLayoutProps = {
	dungeon: Dungeon;
	startingPlayerPosition: Coordinate;
	downStair?: Coordinate;
	upStair?: Coordinate;
	onPlayerMove: (coordinate: Coordinate) => void;
};

const DungeonLayout = ({
	dungeon,
	startingPlayerPosition,
	downStair,
	upStair,
	onPlayerMove,
}: DungeonLayoutProps) => {
	const [playerPosition, setPlayerPosition] = useState(startingPlayerPosition);

	const movePlayer = useCallback(
		(changeUpDown: number, changeLeftRight: number) => {
			setPlayerPosition((current) => {
				const newRow: number = current.row + changeUpDown;
				const newCol: number = current.col + changeLeftRight;

				const isOutOfBounds =
					newRow < 0 ||
					newRow >= dungeon.length ||
					newCol < 0 ||
					newCol >= (dungeon[newRow]?.length ?? 0);

				if (isOutOfBounds) {
					return current;
				}

				const coordinateValueInPositionToMoveTo = getDungeonCoordinateValue(
					newCol,
					newRow,
					dungeon,
				);

				if (coordinateValueInPositionToMoveTo === WALL) {
					return current;
				}

				onPlayerMove({
					row: newRow,
					col: newCol,
				});

				return {
					row: newRow,
					col: newCol,
				};
			});
		},
		[dungeon, onPlayerMove],
	);

	useEffect(() => {
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
	}, [movePlayer]);

	const renderCell = (
		rowIndex: number,
		columnIndex: number,
		cell: string,
	): ReactNode => {
		let displayTile = cell;
		let tileDescription = `row${rowIndex}col${columnIndex}`;

		if (playerPosition.row === rowIndex && playerPosition.col === columnIndex) {
			displayTile = PLAYER;
			tileDescription = `row${rowIndex}col${columnIndex} - player`;
		} else if (
			upStair &&
			upStair.row === rowIndex &&
			upStair.col === columnIndex
		) {
			displayTile = STAIRS_UP;
			tileDescription = `row${rowIndex}col${columnIndex} - stairs up`;
		} else if (
			downStair &&
			downStair.row === rowIndex &&
			downStair.col === columnIndex
		) {
			displayTile = STAIRS_DOWN;
			tileDescription = `row${rowIndex}col${columnIndex} - stairs down`;
		}

		return (
			<td key={columnIndex} aria-label={tileDescription}>
				{displayTile}
			</td>
		);
	};

	return (
		<table aria-label="Dungeon">
			<tbody className="grid">
				{dungeon.map((row, rowIndex) => (
					<tr
						key={rowIndex}
						className="grid"
						style={{
							gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`,
						}}
					>
						{row.map((cell, columnIndex) =>
							renderCell(rowIndex, columnIndex, cell),
						)}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default DungeonLayout;
