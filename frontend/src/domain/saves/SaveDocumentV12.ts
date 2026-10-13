import type { SaveDocumentV11 } from "./SaveDocumentV11";
export type SaveDocumentV12 = Omit<SaveDocumentV11, "version"> & {
	version: 12;
};
