import { BrickWall, Dot, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { FLOOR, PLAYER, STAIRS_DOWN, STAIRS_UP, WALL } from "./LayoutTiles.ts";
import { StairsDownIcon, StairsUpIcon } from "./StairIcons.tsx";

export const TILE_ICONS: Partial<
	Record<string, ComponentType<SVGProps<SVGSVGElement>>>
> = {
	[WALL]: BrickWall,
	[FLOOR]: Dot,
	[PLAYER]: User,
	[STAIRS_UP]: StairsUpIcon,
	[STAIRS_DOWN]: StairsDownIcon,
};

export const TILE_LABELS: Partial<Record<string, string>> = {
	[WALL]: "wall",
	[FLOOR]: "floor",
	[PLAYER]: "player",
	[STAIRS_UP]: "stairs up",
	[STAIRS_DOWN]: "stairs down",
};

export const TILE_ICON_COLORS: Partial<Record<string, string>> = {
	[WALL]: "text-gray-600 dark:text-gray-400",
	[FLOOR]: "text-gray-300 dark:text-gray-600",
	[PLAYER]: "text-red-600 dark:text-red-400",
	[STAIRS_UP]: "text-amber-700 dark:text-amber-400",
	[STAIRS_DOWN]: "text-amber-700 dark:text-amber-400",
};

export const TILE_BACKGROUNDS: Partial<Record<string, string>> = {
	[WALL]: "bg-gray-200 dark:bg-gray-800",
};
