import { TriangleAlert } from "lucide-react";
import { memo, type RefObject } from "react";
import {
	ENTRANCE,
	PLAYER,
	STAIRS_DOWN,
	STAIRS_UP,
} from "../../domain/dungeon/Tiles.ts";
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
	monsterId,
	targetable,
	selectedTarget,
	onTargetRequested,
	threatened = false,
	inSpellArea = false,
}: {
	rowIndex: number;
	columnIndex: number;
	tile?: string;
	visibility: TileVisibility;
	playerRef?: PlayerRef;
	monsterKind?: MonsterKind;
	itemKind?: ItemKind;
	itemCount?: number;
	monsterId?: string;
	targetable?: boolean;
	selectedTarget?: boolean;
	onTargetRequested?: (id: string) => void;
	threatened?: boolean;
	inSpellArea?: boolean;
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
			aria-label={`row${rowIndex}col${columnIndex}${label ? ` - ${label}` : ""}${threatened ? " - prepared heavy attack" : ""}${inSpellArea ? " - spell area" : ""}`}
			title={
				threatened ? "Prepared heavy attack: move away to dodge." : undefined
			}
			data-visibility={visibility}
			className={`relative size-[var(--dungeon-tile-size)] ${background}`}
		>
			{monsterKind ? (
				targetable && monsterId ? (
					<button
						type="button"
						aria-label={`Target ${MONSTER_VISUALS[monsterKind].label} at row ${rowIndex}, column ${columnIndex}`}
						aria-pressed={selectedTarget}
						onClick={() => onTargetRequested?.(monsterId)}
						className={`flex size-full items-center justify-center rounded-sm ring-inset focus-visible:outline-2 focus-visible:outline-amber-500 ${selectedTarget ? "ring-2 ring-violet-600 dark:ring-violet-300 bg-violet-500/25" : "ring-1 ring-violet-500/60"}`}
					>
						<MonsterIcon kind={monsterKind} />
					</button>
				) : (
					<MonsterIcon kind={monsterKind} />
				)
			) : itemKind ? (
				<ItemIcon kind={itemKind} />
			) : (
				tile !== undefined && <TileIcon tile={tile} />
			)}
			{inSpellArea && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 rounded-xs border-2 border-violet-500 bg-violet-500/20 dark:border-violet-300"
				/>
			)}
			{threatened && (
				<span
					aria-hidden="true"
					className="pointer-events-none absolute inset-0 rounded-xs border-2 border-map-threat bg-map-threat/15"
				>
					<TriangleAlert
						className="absolute -right-0.5 -top-0.5 size-2.5 fill-background text-map-threat"
						strokeWidth={2.5}
					/>
				</span>
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
		entranceColumn,
		downStairColumn,
		monsters,
		floorItems,
		playerRef,
		targetIds,
		selectedTargetId,
		onTargetRequested,
		threatColumns,
		spellColumns,
	}: {
		row: readonly string[];
		visible?: readonly boolean[];
		explored?: readonly boolean[];
		rowIndex: number;
		playerColumn?: number;
		upStairColumn?: number;
		entranceColumn?: number;
		downStairColumn?: number;
		monsters?: readonly Monster[];
		floorItems?: readonly FloorItem[];
		playerRef: PlayerRef;
		targetIds?: readonly string[];
		selectedTargetId?: string;
		onTargetRequested?: (id: string) => void;
		threatColumns?: readonly number[];
		spellColumns?: readonly number[];
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
					else if (columnIndex === entranceColumn) tile = ENTRANCE;
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
							inSpellArea={
								visibility === "visible" &&
								(spellColumns?.includes(columnIndex) ?? false)
							}
							threatened={
								visibility === "visible" &&
								(threatColumns?.includes(columnIndex) ?? false)
							}
							monsterId={monster?.id}
							targetable={
								monster &&
								visibility === "visible" &&
								targetIds?.includes(monster.id)
							}
							selectedTarget={monster?.id === selectedTargetId}
							onTargetRequested={onTargetRequested}
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
		(previous.spellColumns?.length ?? 0) === (next.spellColumns?.length ?? 0) &&
		(previous.spellColumns ?? []).every(
			(column, index) => column === next.spellColumns?.[index],
		) &&
		previous.targetIds === next.targetIds &&
		previous.selectedTargetId === next.selectedTargetId &&
		previous.onTargetRequested === next.onTargetRequested &&
		previous.row === next.row &&
		previous.rowIndex === next.rowIndex &&
		previous.visible === next.visible &&
		previous.explored === next.explored &&
		previous.playerColumn === next.playerColumn &&
		previous.upStairColumn === next.upStairColumn &&
		previous.entranceColumn === next.entranceColumn &&
		previous.downStairColumn === next.downStairColumn &&
		previous.playerRef === next.playerRef &&
		(previous.threatColumns?.length ?? 0) ===
			(next.threatColumns?.length ?? 0) &&
		(previous.threatColumns ?? []).every(
			(column, index) => column === next.threatColumns?.[index],
		) &&
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
