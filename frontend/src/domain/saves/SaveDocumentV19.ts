import type { SaveDocumentV18 } from "./SaveDocumentV18";
// Adds the validated monster-door-opened activity event; played state is unchanged.
export type SaveDocumentV19 = Omit<SaveDocumentV18, "version"> & {
	version: 19;
};
