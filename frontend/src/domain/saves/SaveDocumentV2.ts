import type { Coordinate } from "../dungeon/DungeonTypes";
import type { SaveDocumentV1 } from "./SaveDocumentV1";

// V2 preserves the v1 adventure fields and explicitly adds instance intent.
// Keep this persisted union stable when later runtime intent variants change.
type SavedMonsterV2 = SaveDocumentV1["state"]["monsters"][number] & {
	intent: { type: "idle" } | { type: "preparing-attack"; target: Coordinate };
};
export type SaveDocumentV2 = Omit<SaveDocumentV1, "version" | "state"> & {
	version: 2;
	state: Omit<SaveDocumentV1["state"], "monsters"> & {
		monsters: readonly SavedMonsterV2[];
	};
};
