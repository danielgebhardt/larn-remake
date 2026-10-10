import { BrickWall, Dot, User } from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import {
	FLOOR,
	PLAYER,
	STAIRS_DOWN,
	STAIRS_UP,
	WALL,
} from "../../domain/dungeon/Tiles.ts";
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
	[WALL]: "text-wall-icon",
	[FLOOR]: "text-floor-dot",
	[PLAYER]: "text-player",
	[STAIRS_UP]: "text-stairs",
	[STAIRS_DOWN]: "text-stairs",
};

export const TILE_BACKGROUNDS: Partial<Record<string, string>> = {
	[WALL]: "bg-wall-tile",
};
