import { memo, type RefObject } from "react";
import { PLAYER, STAIRS_DOWN, STAIRS_UP } from "./LayoutTiles";
import TileIcon from "./TileIcon";
import { TILE_BACKGROUNDS, TILE_LABELS } from "./TileVisuals";

type PlayerRef = RefObject<HTMLTableCellElement | null>;

const DungeonCell = memo(function DungeonCell({
	rowIndex,
	columnIndex,
	tile,
	playerRef,
}: {
	rowIndex: number;
	columnIndex: number;
	tile: string;
	playerRef?: PlayerRef;
}) {
	const label = TILE_LABELS[tile];
	return (
		<td
			ref={playerRef}
			aria-label={`row${rowIndex}col${columnIndex}${label ? ` - ${label}` : ""}`}
			className={`size-[24px] ${TILE_BACKGROUNDS[tile] ?? ""}`}
		>
			<TileIcon tile={tile} />
		</td>
	);
});

// Terrain rows keep their identity during movement. Only rows containing the
// old or new player position need to revisit their cells.
const DungeonRow = memo(function DungeonRow({
	row,
	rowIndex,
	playerColumn,
	upStairColumn,
	downStairColumn,
	playerRef,
}: {
	row: string[];
	rowIndex: number;
	playerColumn?: number;
	upStairColumn?: number;
	downStairColumn?: number;
	playerRef: PlayerRef;
}) {
	return (
		<tr
			className="grid"
			style={{ gridTemplateColumns: `repeat(${row.length}, 24px)` }}
		>
			{row.map((terrain, columnIndex) => {
				let tile = terrain;
				if (columnIndex === playerColumn) tile = PLAYER;
				else if (columnIndex === upStairColumn) tile = STAIRS_UP;
				else if (columnIndex === downStairColumn) tile = STAIRS_DOWN;
				return (
					<DungeonCell
						key={columnIndex}
						rowIndex={rowIndex}
						columnIndex={columnIndex}
						tile={tile}
						playerRef={tile === PLAYER ? playerRef : undefined}
					/>
				);
			})}
		</tr>
	);
});

export default DungeonRow;
