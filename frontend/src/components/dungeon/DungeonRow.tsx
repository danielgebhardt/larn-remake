import { memo, type RefObject } from "react";
import { PLAYER, STAIRS_DOWN, STAIRS_UP } from "../../domain/dungeon/Tiles.ts";
import type { FloorItem } from "../../domain/items/FloorItems";
import { ITEM_DEFINITIONS, type ItemKind } from "../../domain/items/Item";
import type { Monster, MonsterKind } from "../../domain/monsters/Monster.ts";
import ItemIcon from "../items/ItemIcon";
import MonsterIcon from "../monsters/MonsterIcon.tsx";
import { MONSTER_VISUALS } from "../monsters/MonsterVisuals.ts";
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
	monsterKind,
	itemKind,
	itemCount = 0,
}: {
	rowIndex: number;
	columnIndex: number;
	tile?: string;
	visibility: TileVisibility;
	playerRef?: PlayerRef;
	monsterKind?: MonsterKind;
	itemKind?: ItemKind;
	itemCount?: number;
}) {
	const description = monsterKind
		? MONSTER_VISUALS[monsterKind].label
		: itemKind
			? `${ITEM_DEFINITIONS[itemKind].name}${itemCount > 1 ? ` and ${itemCount - 1} more item${itemCount > 2 ? "s" : ""}` : ""}`
			: tile === undefined
				? "undiscovered"
				: TILE_LABELS[tile];
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
			{monsterKind ? (
				<MonsterIcon kind={monsterKind} />
			) : itemKind ? (
				<ItemIcon kind={itemKind} />
			) : (
				tile !== undefined && <TileIcon tile={tile} />
			)}
		</td>
	);
});

// Terrain and discovery rows keep their identity when unchanged. Only rows
// with a player, visibility or actor change need to revisit their cells.
const DungeonRow = memo(
	function DungeonRow({
		row,
		rowIndex,
		visible,
		explored,
		playerColumn,
		upStairColumn,
		downStairColumn,
		monsters,
		floorItems,
		playerRef,
	}: {
		row: readonly string[];
		visible?: readonly boolean[];
		explored?: readonly boolean[];
		rowIndex: number;
		playerColumn?: number;
		upStairColumn?: number;
		downStairColumn?: number;
		monsters?: readonly Monster[];
		floorItems?: readonly FloorItem[];
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
					const monster = monsters?.find(
						(actor) => actor.coordinate.col === columnIndex,
					);
					let tile = terrain;
					if (columnIndex === playerColumn) tile = PLAYER;
					else if (columnIndex === upStairColumn) tile = STAIRS_UP;
					else if (columnIndex === downStairColumn) tile = STAIRS_DOWN;
					const items =
						visibility === "visible" &&
						tile !== PLAYER &&
						tile !== STAIRS_UP &&
						tile !== STAIRS_DOWN
							? floorItems?.filter(
									(item) => item.coordinate.col === columnIndex,
								)
							: undefined;
					return (
						<DungeonCell
							key={columnIndex}
							rowIndex={rowIndex}
							columnIndex={columnIndex}
							tile={visibility === "unknown" ? undefined : tile}
							visibility={visibility}
							itemKind={items?.[0]?.item.kind}
							itemCount={items?.length}
							monsterKind={
								visibility === "visible" &&
								tile !== PLAYER &&
								monster?.coordinate.col === columnIndex &&
								monster.health > 0
									? monster.kind
									: undefined
							}
							playerRef={tile === PLAYER ? playerRef : undefined}
						/>
					);
				})}
			</tr>
		);
	},
	(previous, next) =>
		previous.row === next.row &&
		previous.rowIndex === next.rowIndex &&
		previous.visible === next.visible &&
		previous.explored === next.explored &&
		previous.playerColumn === next.playerColumn &&
		previous.upStairColumn === next.upStairColumn &&
		previous.downStairColumn === next.downStairColumn &&
		previous.playerRef === next.playerRef &&
		(previous.floorItems?.length ?? 0) === (next.floorItems?.length ?? 0) &&
		(previous.floorItems ?? []).every(
			(item, index) => item === next.floorItems?.[index],
		) &&
		(previous.monsters?.length ?? 0) === (next.monsters?.length ?? 0) &&
		(previous.monsters ?? []).every(
			(monster, index) => monster === next.monsters?.[index],
		),
);

export default DungeonRow;
