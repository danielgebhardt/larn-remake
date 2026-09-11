import { dungeon } from "./LayoutTiles.ts";

const DungeonLayout = () => {
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
								{cell}
							</td>
						))}
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default DungeonLayout;
