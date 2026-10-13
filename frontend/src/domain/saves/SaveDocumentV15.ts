import type { Coordinate } from "../dungeon/DungeonTypes";
import type { SaveDocumentV14 } from "./SaveDocumentV14";

type PreviousMonster = SaveDocumentV14["state"]["monsters"][number];
export type SaveDocumentV15 = Omit<SaveDocumentV14, "version" | "state"> & {
	version: 15;
	state: Omit<SaveDocumentV14["state"], "monsters"> & {
		monsters: readonly (Omit<PreviousMonster, "intent"> & {
			intent:
				| PreviousMonster["intent"]
				| { type: "preparing-charge"; target: Coordinate }
				| { type: "recovering-charge" };
		})[];
	};
};
