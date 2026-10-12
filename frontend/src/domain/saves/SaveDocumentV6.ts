import type { Equipment } from "../items/Equipment";
import type { SaveDocumentV5 } from "./SaveDocumentV5";
export type SaveDocumentV6 = Omit<SaveDocumentV5, "version" | "state"> & {
	version: 6;
	state: Omit<SaveDocumentV5["state"], "equipment"> & { equipment: Equipment };
};
