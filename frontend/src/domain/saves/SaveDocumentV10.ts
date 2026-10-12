import type { SaveDocumentV9 } from "./SaveDocumentV9";
export type SaveDocumentV10 = Omit<SaveDocumentV9, "version" | "state"> & {
	version: 10;
	state: SaveDocumentV9["state"] & { gold: number };
};
