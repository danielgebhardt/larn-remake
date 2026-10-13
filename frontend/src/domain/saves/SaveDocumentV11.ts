import type { SaveDocumentV10 } from "./SaveDocumentV10";
export type SaveDocumentV11 = Omit<SaveDocumentV10, "version"> & {
	version: 11;
};
