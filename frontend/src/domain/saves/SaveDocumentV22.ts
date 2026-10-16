import type { SaveDocumentV21 } from "./SaveDocumentV21";
export type SaveDocumentV22 = Omit<SaveDocumentV21, "version"> & {
	version: 22;
};
