import { PLAYER, STAIRS_DOWN, STAIRS_UP } from "../../domain/dungeon/Tiles.ts";
import TileIcon from "./TileIcon.tsx";

const entries = [
	{ tile: PLAYER, label: "Player" },
	{ tile: STAIRS_UP, label: "Stairs up" },
	{ tile: STAIRS_DOWN, label: "Stairs down" },
];

const DungeonLegend = ({ fogEnabled = false }: { fogEnabled?: boolean }) => (
	<ul
		aria-label="Dungeon legend"
		className="my-2 flex shrink-0 flex-wrap justify-center gap-x-5 gap-y-2 text-sm"
	>
		{entries.map(({ tile, label }) => (
			<li key={tile} className="flex items-center gap-2">
				<span className="block size-[var(--dungeon-tile-size)]">
					<TileIcon tile={tile} />
				</span>
				<span>{label}</span>
			</li>
		))}
		{fogEnabled &&
			[
				{ label: "Visible", className: "bg-fog-visible" },
				{ label: "Remembered", className: "bg-fog-remembered" },
				{ label: "Undiscovered", className: "bg-fog-unseen" },
			].map(({ label, className }) => (
				<li key={label} className="flex items-center gap-2">
					<span
						aria-hidden="true"
						className={`size-4 rounded-sm border-2 ${className}`}
					/>
					<span>{label}</span>
				</li>
			))}
		<li className="flex items-center text-muted-foreground">Spacebar: wait</li>
	</ul>
);

export default DungeonLegend;
