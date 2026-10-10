import { TILE_ICON_COLORS, TILE_ICONS } from "./TileVisuals.ts";

const TileIcon = ({ tile }: { tile: string }) => {
	const Icon = TILE_ICONS[tile];
	if (!Icon) return tile;

	return (
		<span className={`block size-full ${TILE_ICON_COLORS[tile] ?? ""}`}>
			<Icon aria-hidden="true" focusable="false" className="block size-full" />
		</span>
	);
};

export default TileIcon;
