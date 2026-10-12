import type { DungeonObject } from "../objects/DungeonObject";
import type { SaveDocumentV8 } from "./SaveDocumentV8";
// Object content may grow; its flat played-state fields remain explicit.
export type SaveDocumentV9 = Omit<SaveDocumentV8, "version" | "state"> & {
	version: 9;
	state: SaveDocumentV8["state"] & { objects: readonly DungeonObject[] };
};
