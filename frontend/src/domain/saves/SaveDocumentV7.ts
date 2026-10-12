import type { SaveDocumentV6 } from "./SaveDocumentV6";
export type SaveDocumentV7 = Omit<SaveDocumentV6, "version" | "state"> & {
	version: 7;
	state: Omit<SaveDocumentV6["state"], "monsters"> & {
		monsters: readonly (SaveDocumentV6["state"]["monsters"][number] & {
			lastDamagedTurn: number | null;
		})[];
	};
};
