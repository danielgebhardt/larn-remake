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
	fountain: {
		name: "Ancient fountain",
		freshLabel: "ancient fountain",
		usedLabel: "dry fountain",
		minFloor: 2,
		maxFloor: 20,
		maxPerFloor: 1,
		chance: 0.45,
		placement: "room",
	},
	trap: {
		name: "Visible trap",
		freshLabel: "visible trap",
		usedLabel: "spent trap",
		minFloor: 2,
		maxFloor: 20,
		maxPerFloor: 2,
		chance: 0.6,
		placement: "room",
	},
	chest: {
		name: "Treasure chest",
		freshLabel: "treasure chest",
		usedLabel: "opened chest",
		minFloor: 1,
		maxFloor: 20,
		maxPerFloor: 1,
		chance: 0.8,
		placement: "room",
	},
	gold: {
		name: "Gold",
		freshLabel: "gold coins",
		usedLabel: "empty coin cache",
		minFloor: 1,
		maxFloor: 20,
		maxPerFloor: 2,
		chance: 1,
		placement: "room",
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
