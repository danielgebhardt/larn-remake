import { useEffect, useState } from "react";
import { type Coordinate, PLAYER } from "./LayoutTiles.ts";

type DungeonLayoutProps = {
	dungeon: string[][];
	startingPlayerPosition: Coordinate;
};

const DungeonLayout = ({
	dungeon,
	startingPlayerPosition,
}: DungeonLayoutProps) => {
	const [playerPosition, setPlayerPosition] = useState(startingPlayerPosition);
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			switch (event.key) {
				case "ArrowUp":
				case "w":
					setPlayerPosition({
						row: playerPosition.row - 1,
						col: playerPosition.col,
					});
					break;

				case "ArrowDown":
				case "s":
					setPlayerPosition({
						row: playerPosition.row + 1,
						col: playerPosition.col,
					});
					break;

				case "ArrowLeft":
				case "a":
					setPlayerPosition({
						row: playerPosition.row,
						col: playerPosition.col - 1,
					});
					break;

				case "ArrowRight":
				case "d":
					setPlayerPosition({
						row: playerPosition.row,
						col: playerPosition.col + 1,
					});
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [playerPosition.row, playerPosition.col]);

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
