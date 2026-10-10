import { PLAYER, STAIRS_DOWN, STAIRS_UP } from "../../domain/dungeon/Tiles.ts";
import TileIcon from "./TileIcon.tsx";

const tileEntries = [
	{ tile: PLAYER, label: "Player", description: "Your current position." },
	{
		tile: STAIRS_UP,
		label: "Stairs up",
		description: "Leads to the floor above.",
	},
	{
		tile: STAIRS_DOWN,
		label: "Stairs down",
		description: "Leads to the floor below.",
	},
];
const fogEntries = [
	{
		label: "Visible",
		className: "bg-fog-visible",
		description: "Currently in sight.",
	},
	{
		label: "Remembered",
		className: "bg-fog-remembered",
		description: "Explored before, but outside current sight.",
	},
	{
		label: "Undiscovered",
		className: "bg-fog-unseen",
		description: "Not explored yet.",
	},
];

const DungeonLegend = () => (
	<ul
		aria-label="Dungeon legend"
		className="grid gap-4 rounded-lg border bg-muted/30 p-3 text-sm"
	>
		{tileEntries.map(({ tile, label, description }) => (
			<li key={tile} className="flex items-center gap-3">
				<span className="block size-[var(--dungeon-tile-size)] shrink-0">
					<TileIcon tile={tile} />
				</span>
				<div>
					<p className="font-medium">{label}</p>
					<p className="text-xs leading-relaxed text-muted-foreground">
						{description}
					</p>
				</div>
			</li>
		))}
		{fogEntries.map(({ label, className, description }) => (
			<li key={label} className="flex items-center gap-3">
				<span
					aria-hidden="true"
					className={`size-[var(--dungeon-tile-size)] shrink-0 rounded-sm border-2 ${className}`}
				/>
				<div>
					<p className="font-medium">{label}</p>
					<p className="text-xs leading-relaxed text-muted-foreground">
						{description}
					</p>
				</div>
			</li>
		))}
	</ul>
);

export default DungeonLegend;
