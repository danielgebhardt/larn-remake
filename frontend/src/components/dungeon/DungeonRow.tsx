import { memo, type RefObject } from "react";
import { PLAYER, STAIRS_DOWN, STAIRS_UP } from "../../domain/dungeon/Tiles.ts";
import TileIcon from "./TileIcon.tsx";
import { TILE_BACKGROUNDS, TILE_LABELS } from "./TileVisuals.ts";

type TileVisibility = "visible" | "remembered" | "unknown";

type PlayerRef = RefObject<HTMLTableCellElement | null>;

const DungeonCell = memo(function DungeonCell({
	rowIndex,
	columnIndex,
	tile,
	visibility,
	playerRef,
}: {
	rowIndex: number;
	columnIndex: number;
	tile?: string;
	visibility: TileVisibility;
	playerRef?: PlayerRef;
}) {
	const description = tile === undefined ? "undiscovered" : TILE_LABELS[tile];
	const label =
		visibility === "remembered" ? `remembered ${description}` : description;
	const background =
		visibility === "unknown"
			? "bg-fog-unseen"
			: visibility === "remembered"
				? "bg-fog-remembered"
				: tile === undefined
					? ""
					: (TILE_BACKGROUNDS[tile] ?? "bg-fog-visible");
	return (
		<td
			ref={playerRef}
			aria-label={`row${rowIndex}col${columnIndex}${label ? ` - ${label}` : ""}`}
			data-visibility={visibility}
			className={`size-[var(--dungeon-tile-size)] ${background}`}
		>
			{tile !== undefined && <TileIcon tile={tile} />}
		</td>
	);
});

// Terrain and discovery rows keep their identity when unchanged. Only rows
// with a player or visibility change need to revisit their cells.
const DungeonRow = memo(function DungeonRow({
	row,
	rowIndex,
	visible,
	explored,
	playerColumn,
	upStairColumn,
	downStairColumn,
	playerRef,
}: {
	row: readonly string[];
	visible?: readonly boolean[];
	explored?: readonly boolean[];
	rowIndex: number;
	playerColumn?: number;
	upStairColumn?: number;
	downStairColumn?: number;
	playerRef: PlayerRef;
}) {
	return (
		<tr
			className="grid"
			style={{
				gridTemplateColumns: `repeat(${row.length}, var(--dungeon-tile-size))`,
			}}
		>
			{row.map((terrain, columnIndex) => {
				const visibility: TileVisibility =
					columnIndex === playerColumn ||
					visible === undefined ||
					visible[columnIndex]
						? "visible"
						: explored?.[columnIndex]
							? "remembered"
							: "unknown";
				let tile = terrain;
				if (columnIndex === playerColumn) tile = PLAYER;
				else if (columnIndex === upStairColumn) tile = STAIRS_UP;
				else if (columnIndex === downStairColumn) tile = STAIRS_DOWN;
				return (
					<DungeonCell
						key={columnIndex}
						rowIndex={rowIndex}
						columnIndex={columnIndex}
						tile={visibility === "unknown" ? undefined : tile}
						visibility={visibility}
						playerRef={tile === PLAYER ? playerRef : undefined}
					/>
				);
			})}
		</tr>
	);
});

export default DungeonRow;
