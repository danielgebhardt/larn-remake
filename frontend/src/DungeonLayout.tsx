import { type Coordinate, PLAYER } from "./LayoutTiles.ts";

type DungeonLayoutProps = {
	dungeon: string[][];
	playerPosition: Coordinate;
};

const DungeonLayout = ({ dungeon, playerPosition }: DungeonLayoutProps) => {
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
