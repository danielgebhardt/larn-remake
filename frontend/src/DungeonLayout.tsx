import { useCallback, useEffect, useState } from "react";
import {
	type Coordinate,
	getDungeonCoordinateValue,
	PLAYER,
	WALL,
} from "./LayoutTiles.ts";

type DungeonLayoutProps = {
	dungeon: string[][];
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
			switch (event.key) {
				case "ArrowUp":
				case "w":
					movePlayer(-1, 0);
					break;

				case "ArrowDown":
				case "s":
					movePlayer(1, 0);
					break;

				case "ArrowLeft":
				case "a":
					movePlayer(0, -1);
					break;

				case "ArrowRight":
				case "d":
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
					<tr key={rowIndex} className="grid grid-cols-5">
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
