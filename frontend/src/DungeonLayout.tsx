import { dungeon } from "./LayoutTiles.ts";

const DungeonLayout = () => {
	return (
		<table>
			<tbody>
				{dungeon.map((row, rowIndex) => (
					<tr key={`row${rowIndex.toString()}`}>
						<td
							key={`row${
								// biome-ignore lint/suspicious/noArrayIndexKey: <ignore for now>
								rowIndex
							}cell1`}
							aria-label={`row${rowIndex}cell0`}
						>
							{row.map((cell, cellIndex) => (
								<div
									key={`cell${rowIndex.toString()}cell${cellIndex.toString()}`}
								>
									{cell}
								</div>
							))}
						</td>
					</tr>
				))}
			</tbody>
		</table>
	);
};

export default DungeonLayout;
