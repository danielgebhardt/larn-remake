import type { SavedItemV1 } from "./SaveDocumentV1";
import type { SaveDocumentV17 } from "./SaveDocumentV17";
export type SavedItemV18 = SavedItemV1 & { enchantment?: number };
export type SaveDocumentV18 = Omit<SaveDocumentV17, "version" | "state"> & {
	version: 18;
	state: Omit<SaveDocumentV17["state"], "equipment" | "bag" | "floorItems"> & {
		equipment: Readonly<
			Record<keyof SaveDocumentV17["state"]["equipment"], SavedItemV18 | null>
		>;
		bag: Readonly<{ items: readonly SavedItemV18[] }>;
		floorItems: readonly (Omit<
			SaveDocumentV17["state"]["floorItems"][number],
			"item"
		> & { item: SavedItemV18 })[];
	};
};
