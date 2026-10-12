import type { Coordinate } from "../dungeon/DungeonTypes";
export const OBJECT_DEFINITIONS = {
	door: {
		name: "Door",
		freshLabel: "closed door",
		usedLabel: "open door",
		minFloor: 1,
		maxFloor: 20,
		maxPerFloor: 2,
		chance: 1,
		placement: "passage",
	},
} as const;
export type DungeonObjectKind = keyof typeof OBJECT_DEFINITIONS;
export type DungeonObject = Readonly<{
	id: string;
	kind: DungeonObjectKind;
	floorNumber: number;
	coordinate: Coordinate;
	activated: boolean;
}>;
export const objectLabel = (object: DungeonObject): string =>
	object.activated
		? OBJECT_DEFINITIONS[object.kind].usedLabel
		: OBJECT_DEFINITIONS[object.kind].freshLabel;
