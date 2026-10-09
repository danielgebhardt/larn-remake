import { PLAYER, STAIRS_DOWN, STAIRS_UP } from "./LayoutTiles.ts";
import TileIcon from "./TileIcon.tsx";

const entries = [
	{ tile: PLAYER, label: "Player" },
	{ tile: STAIRS_UP, label: "Stairs up" },
	{ tile: STAIRS_DOWN, label: "Stairs down" },
];

const DungeonLegend = () => (
	<ul
		aria-label="Dungeon legend"
		className="my-2 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm"
	>
		{entries.map(({ tile, label }) => (
			<li key={tile} className="flex items-center gap-2">
				<span className="block size-[24px]">
					<TileIcon tile={tile} />
				</span>
				<span>{label}</span>
			</li>
		))}
	</ul>
);

export default DungeonLegend;
