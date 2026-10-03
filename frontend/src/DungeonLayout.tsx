import { useCallback, useEffect, useState } from "react";
import {
	type Coordinate,
	type Dungeon,
	getDungeonCoordinateValue,
	PLAYER,
	WALL,
} from "./LayoutTiles.ts";

type DungeonLayoutProps = {
	dungeon: Dungeon;
	startingPlayerPosition: Coordinate;
};

const DungeonLayout = ({
	dungeon,
	startingPlayerPosition,
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

				return {
					row: newRow,
					col: newCol,
				};
			});
		},
		[dungeon],
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
						{row.map((cell, columnIndex) => (
							<td
								key={columnIndex}
								aria-label={`row${rowIndex}col${columnIndex}`}
							>
								{playerPosition.row === rowIndex &&
								playerPosition.col === columnIndex
									? PLAYER
									: cell}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default DungeonLayout;
