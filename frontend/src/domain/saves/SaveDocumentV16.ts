import type { Coordinate } from "../dungeon/DungeonTypes";
import type { SaveDocumentV15 } from "./SaveDocumentV15";

type PreviousMonster = SaveDocumentV15["state"]["monsters"][number];
export type SaveDocumentV16 = Omit<SaveDocumentV15, "version" | "state"> & {
	version: 16;
	state: Omit<SaveDocumentV15["state"], "monsters"> & {
		monsters: readonly (Omit<PreviousMonster, "intent"> & {
			alarmUsed?: boolean;
			intent:
				| PreviousMonster["intent"]
				| { type: "preparing-alarm"; target: Coordinate };
		})[];
	};
};
