import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Castle,
	Flame,
	Map as MapIcon,
	UserRound,
} from "lucide-react";
import {
	type RefObject,
	useCallback,
	useEffect,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import type { MovementDirection } from "../../domain/dungeon/DungeonRun";
import type { TownAction } from "../../domain/town/TownActions";
import { TOWN, type TownBuilding } from "../../domain/town/TownDefinition";
import type { TownLocation } from "../../domain/town/TownLocation";
import { Button } from "../ui/button";

import TownDirectory from "./TownDirectory";
import { TownBuildingIcon } from "./TownVisuals";

const KEY_DIRECTION: Readonly<Record<string, MovementDirection | undefined>> = {
	ArrowUp: "up",
	w: "up",
	ArrowDown: "down",
	s: "down",
	ArrowLeft: "left",
	a: "left",
	ArrowRight: "right",
	d: "right",
};
const TILE_STYLE: Readonly<Record<string, string>> = {
	"#": "bg-slate-400 dark:bg-slate-800 border-slate-500/30",
	".": "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-900/5",
	"=": "bg-stone-200 dark:bg-stone-700/60 border-stone-500/20",
	R: "bg-slate-300 dark:bg-slate-700 border-slate-500/30",
	D: "bg-amber-200 dark:bg-amber-950 border-amber-700/40 text-amber-950 dark:text-amber-200",
	B: "bg-amber-100 dark:bg-amber-950 text-orange-700 dark:text-orange-300 border-amber-600",
	G: "bg-stone-300 dark:bg-stone-800 text-slate-950 dark:text-slate-100 border-stone-500",
};
const TILE_NAME: Readonly<Record<string, string>> = {
	"#": "town wall",
	".": "ground",
	"=": "paving",
	R: "roof",
	D: "closed threshold",
	B: "beacon",
	G: "dungeon gate",
};
const roofStyle = (building: TownBuilding | undefined): string => {
	switch (building?.district) {
		case "Quiet Lane":
			return "bg-indigo-200 dark:bg-indigo-950 border-indigo-500/30";
		case "Forge Court":
			return "bg-orange-200 dark:bg-orange-950 border-orange-500/30";
		case "Market Street":
			return "bg-sky-200 dark:bg-sky-950 border-sky-500/30";
		default:
			return TILE_STYLE.R;
	}
};
const WALK_BUTTONS = [
	{ direction: "up", name: "Walk north", Icon: ArrowUp },
	{ direction: "left", name: "Walk west", Icon: ArrowLeft },
	{ direction: "down", name: "Walk south", Icon: ArrowDown },
	{ direction: "right", name: "Walk east", Icon: ArrowRight },
] as const;

const TownMap = ({
	location,
	onAction,
	mapRef,
	enabled = true,
	preview = false,
	onTravel,
	interactionLabel = "Inspect nearby",
	onCharacterRequested,
}: {
	location: TownLocation;
	onAction: (action: TownAction) => void;
	mapRef?: RefObject<HTMLElement | null>;
	enabled?: boolean;
	preview?: boolean;
	onTravel?: () => void;
	interactionLabel?: string;
	onCharacterRequested?: () => void;
}) => {
	const instructionsId = useId();
	const [directoryOpen, setDirectoryOpen] = useState(false);
	const controlsEnabled = enabled && !directoryOpen;
	const localViewport = useRef<HTMLElement>(null);
	const viewport = mapRef ?? localViewport;
	const player = useRef<HTMLTableCellElement>(null);
	const { row: playerRow, col: playerCol } = location.coordinate;
	const followPlayer = useCallback(() => {
		// Follow the player inside this viewport only; never scroll the dialog or the game.
		const container = viewport.current;
		const cell = player.current;
		if (!container || !cell) return;
		const bounds = container.getBoundingClientRect();
		const tile = cell.getBoundingClientRect();
		if (tile.left < bounds.left)
			container.scrollLeft -= bounds.left - tile.left + 20;
		else if (tile.right > bounds.right)
			container.scrollLeft += tile.right - bounds.right + 20;
		if (tile.top < bounds.top)
			container.scrollTop -= bounds.top - tile.top + 20;
		else if (tile.bottom > bounds.bottom)
			container.scrollTop += tile.bottom - bounds.bottom + 20;
	}, [viewport]);
	useLayoutEffect(followPlayer);
	useEffect(() => {
		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", followPlayer);
			return () => window.removeEventListener("resize", followPlayer);
		}
		const observer = new ResizeObserver(followPlayer);
		if (viewport.current) observer.observe(viewport.current);
		return () => observer.disconnect();
	}, [viewport, followPlayer]);

	const act = (action: TownAction) => {
		if (controlsEnabled) onAction(action);
		viewport.current?.focus({ preventScroll: true });
	};
	return (
		<div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
			<p id={instructionsId} className="sr-only">
				Use arrows or WASD to walk. E inspects signs. Stand on the dungeon gate
				and press Enter to descend.
			</p>
			<section
				ref={viewport}
				aria-label={preview ? "Town map preview" : "Town map"}
				aria-describedby={instructionsId}
				// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to focus the scrollable town map, like the dungeon map.
				tabIndex={0}
				className={`${preview ? "max-h-[22rem]" : "min-h-0 flex-1"} min-w-0 overflow-auto rounded-md border border-transparent bg-transparent outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary`}
				onKeyDown={(event) => {
					if (
						!controlsEnabled ||
						event.target !== event.currentTarget ||
						event.altKey ||
						event.ctrlKey ||
						event.metaKey
					)
						return;
					const key =
						event.key.length === 1 ? event.key.toLowerCase() : event.key;
					const direction = Object.hasOwn(KEY_DIRECTION, key)
						? KEY_DIRECTION[key]
						: undefined;
					if (direction) {
						event.preventDefault();
						event.stopPropagation();
						onAction({ type: "move", direction });
					} else if (key === "Enter" && onTravel && !event.repeat) {
						event.preventDefault();
						event.stopPropagation();
						onTravel();
					} else if (key === "c" && onCharacterRequested && !event.repeat) {
						event.preventDefault();
						event.stopPropagation();
						onCharacterRequested();
					} else if (key === "?") {
						event.preventDefault();
						event.stopPropagation();
						setDirectoryOpen(true);
					} else if (key === "e") {
						event.preventDefault();
						event.stopPropagation();
						onAction({ type: "inspect" });
					}
				}}
			>
				<div className="grid min-h-full min-w-max">
					<table
						className="m-auto w-max table-fixed border-collapse text-center text-xs font-sans"
						aria-label="Fixed town layout"
					>
						<tbody>
							{TOWN.terrain.map((tiles, row) => (
								<tr key={`row-${row}`}>
									{Array.from(tiles).map((tile, col) => {
										const occupied = row === playerRow && col === playerCol;
										const building = TOWN.buildings.find(
											(building) =>
												row >= building.row &&
												row < building.row + building.height &&
												col >= building.col &&
												col < building.col + building.width,
										);
										const label = `${row}, ${col}: ${occupied ? "player; " : ""}${building ? `${building.name}, ${tile === "D" ? `${building.status} entrance` : "roof"}` : TILE_NAME[tile]}`;
										return (
											<td
												key={`${row}-${col}`}
												ref={occupied ? player : undefined}
												aria-label={label}
												title={label}
												className={`size-5 min-w-5 border p-0 ${occupied ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 outline outline-2 -outline-offset-2 outline-red-500" : tile === "R" ? roofStyle(building) : TILE_STYLE[tile]}`}
											>
												{occupied ? (
													<UserRound
														aria-hidden="true"
														className="size-4 mx-auto"
													/>
												) : tile === "B" ? (
													<Flame
														aria-hidden="true"
														className="size-4 mx-auto"
													/>
												) : tile === "G" ? (
													<Castle
														aria-hidden="true"
														className="size-4 mx-auto"
													/>
												) : tile === "D" ? (
													building?.mark
												) : tile === "R" &&
													building &&
													row === building.row + 1 &&
													col === building.entry.col ? (
													<TownBuildingIcon
														id={building.id}
														className="mx-auto size-4 text-foreground"
													/>
												) : null}
											</td>
										);
									})}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</section>
			<fieldset className="flex flex-wrap items-center gap-2">
				<legend className="sr-only">Town walking controls</legend>
				{WALK_BUTTONS.map(({ direction, name, Icon }) => (
					<Button
						key={direction}
						variant="outline"
						aria-label={name}
						className="size-11"
						disabled={!controlsEnabled}
						onClick={() => act({ type: "move", direction })}
					>
						<Icon aria-hidden="true" />
					</Button>
				))}
				<Button
					variant="outline"
					className="min-h-11"
					disabled={!controlsEnabled}
					onClick={() => act({ type: "inspect" })}
				>
					{interactionLabel}
				</Button>
				<Button
					variant="outline"
					className="size-11"
					aria-label="Town directory"
					title="Town directory (?)"
					disabled={!controlsEnabled}
					onClick={() => setDirectoryOpen(true)}
				>
					<MapIcon aria-hidden="true" />
				</Button>
				{!preview && (
					<Button
						variant="outline"
						className="min-h-11"
						disabled={!controlsEnabled || !onTravel}
						onClick={onTravel}
					>
						Enter dungeon
					</Button>
				)}
			</fieldset>
			<TownDirectory
				open={directoryOpen}
				onClose={() => setDirectoryOpen(false)}
				mapRef={viewport}
			/>
		</div>
	);
};
export default TownMap;
