import type { MonsterAwareness } from "../monsters/Monster";
import type { SaveDocumentV12 } from "./SaveDocumentV12";
export type SaveDocumentV13 = Omit<SaveDocumentV12, "version" | "state"> & {
	version: 13;
	state: Omit<SaveDocumentV12["state"], "monsters"> & {
		monsters: readonly (SaveDocumentV12["state"]["monsters"][number] & {
			awareness?: MonsterAwareness;
		})[];
	};
};
