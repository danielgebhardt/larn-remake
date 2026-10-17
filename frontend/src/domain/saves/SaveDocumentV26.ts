import type { PermanentAttributes } from "../game/PermanentAttributes";
import type { SaveDocumentV25 } from "./SaveDocumentV25";
export type SaveDocumentV26 = Omit<SaveDocumentV25, "version" | "state"> & {
	version: 26;
	state: Omit<SaveDocumentV25["state"], "progression"> & {
		progression: {
			experience: number;
			permanentAttributes: PermanentAttributes;
		};
	};
};
