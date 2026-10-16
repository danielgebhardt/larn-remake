import type { SaveDocumentV20 } from "./SaveDocumentV20";
// V21 admits exit-scroll ownership and its explicit one-turn travel event.
export type SaveDocumentV21 = Omit<SaveDocumentV20, "version"> & {
	version: 21;
};
