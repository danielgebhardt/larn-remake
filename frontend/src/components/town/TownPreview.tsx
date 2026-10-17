import {
	ArrowDown,
	ArrowLeft,
	ArrowRight,
	ArrowUp,
	Castle,
	Flame,
	UserRound,
} from "lucide-react";
import { useId, useLayoutEffect, useReducer, useRef } from "react";
import type { MovementDirection } from "../../domain/dungeon/DungeonRun";
import {
	resolveTownAction,
	type TownAction,
} from "../../domain/town/TownActions";
import { TOWN, type TownBuilding } from "../../domain/town/TownDefinition";
import { createTownLocation } from "../../domain/town/TownLocation";
import { Button } from "../ui/button";

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

const TownPreview = () => {
	const instructionsId = useId();
	const viewport = useRef<HTMLElement>(null);
	const player = useRef<HTMLTableCellElement>(null);
	const [result, dispatch] = useReducer(
		(state: ReturnType<typeof resolveTownAction>, action: TownAction) =>
			resolveTownAction(state.location, action),
		{
			location: createTownLocation(),
			turnAdvanced: false,
			message: "Walk beside a doorway and inspect its sign.",
		},
	);
	const { row: playerRow, col: playerCol } = result.location.coordinate;
	useLayoutEffect(() => {
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
	});
	const act = (action: TownAction) => {
		dispatch(action);
		viewport.current?.focus({ preventScroll: true });
	};
	return (
		<section className="grid min-w-0 gap-3" aria-label="Beacon town preview">
			<div>
				<h3 className="text-lg font-semibold">Beacon town · Level 0</h3>
				<p className="text-sm text-muted-foreground">
					Town plan — preview only. Walking here does not change your adventure.
					All buildings are closed.
				</p>
			</div>
			<p id={instructionsId} className="text-sm">
				Focus the map and use arrows or WASD to walk. E inspects nearby signs.
				Escape returns to your adventure.
			</p>
			<div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_14rem]">
				<div className="min-w-0 space-y-3">
					<section
						ref={viewport}
						aria-label="Town map preview"
						aria-describedby={instructionsId}
						// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to focus the scrollable town map, like the dungeon map.
						tabIndex={0}
						className="max-h-[22rem] min-w-0 overflow-auto rounded-md border bg-muted outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
						onKeyDown={(event) => {
							if (
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
								dispatch({ type: "move", direction });
							} else if (key === "e") {
								event.preventDefault();
								event.stopPropagation();
								dispatch({ type: "inspect" });
							}
						}}
					>
						<table
							className="w-max table-fixed border-collapse text-center text-xs font-sans"
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
											const label = `${row}, ${col}: ${occupied ? "player; " : ""}${building ? `${building.name}, ${tile === "D" ? "closed entrance" : "roof"}` : TILE_NAME[tile]}`;
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
													) : null}
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</section>
					<fieldset className="flex flex-wrap items-center gap-2">
						<legend className="sr-only">Town walking controls</legend>
						{WALK_BUTTONS.map(({ direction, name, Icon }) => (
							<Button
								key={direction}
								variant="outline"
								aria-label={name}
								className="size-11"
								onClick={() => act({ type: "move", direction })}
							>
								<Icon aria-hidden="true" />
							</Button>
						))}
						<Button
							variant="outline"
							className="min-h-11"
							onClick={() => act({ type: "inspect" })}
						>
							Inspect nearby
						</Button>
					</fieldset>
					<p className="text-sm tabular-nums">
						Position: {playerRow}, {playerCol} · Town 29 × 21
					</p>
					<p role="status" className="min-h-12 text-sm text-muted-foreground">
						{result.message ||
							"Walking in town is free. No adventure time or resources change."}
					</p>
				</div>
				<div className="space-y-3">
					<h4 className="font-semibold">Districts & destinations</h4>
					<p className="text-sm text-muted-foreground">
						Beacon square: 8, 14 · Arrival: 17, 14 · Dungeon gate: 19, 14
					</p>
					<ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
						{TOWN.buildings.map((building) => (
							<li
								key={building.id}
								className="rounded border bg-muted/20 px-3 py-2 text-sm"
							>
								<p className="font-semibold">
									<span
										aria-hidden="true"
										className="mr-2 inline-block font-sans"
									>
										{building.mark}
									</span>
									{building.name}
								</p>
								<p className="text-muted-foreground">
									{building.district} · {building.entry.row},{" "}
									{building.entry.col}
								</p>
								<p className="text-muted-foreground">Closed</p>
							</li>
						))}
					</ul>
				</div>
			</div>
		</section>
	);
};
export default TownPreview;
