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
					setPlayerPosition((current) => ({
						row: current.row - 1,
						col: current.col,
					}));
					break;

				case "ArrowDown":
				case "s":
					setPlayerPosition((current) => ({
						row: current.row + 1,
						col: current.col,
					}));
					break;

				case "ArrowLeft":
				case "a":
					setPlayerPosition((current) => ({
						row: current.row,
						col: current.col - 1,
					}));
					break;

				case "ArrowRight":
				case "d":
					setPlayerPosition((current) => ({
						row: current.row,
						col: current.col + 1,
					}));
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

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
