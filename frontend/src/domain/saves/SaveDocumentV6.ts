import type { SavedItemV1 } from "./SaveDocumentV1";
import type { SaveDocumentV5 } from "./SaveDocumentV5";
export type SaveDocumentV6 = Omit<SaveDocumentV5, "version" | "state"> & {
	version: 6;
	state: Omit<SaveDocumentV5["state"], "equipment"> & {
		equipment: Readonly<
			Record<
				"mainHand" | "offHand" | "chest" | "head" | "leftRing" | "rightRing",
				SavedItemV1 | null
			>
		>;
	};
};
