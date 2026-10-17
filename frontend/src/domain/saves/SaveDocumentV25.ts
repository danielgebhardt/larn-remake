import type { ItemInstance } from "../items/Item";
import type { SaveDocumentV24 } from "./SaveDocumentV24";
export type SaveDocumentV25 = Omit<SaveDocumentV24, "version" | "state"> & {
	version: 25;
	state: SaveDocumentV24["state"] & {
		townEquipmentStock: readonly ItemInstance[];
	};
};
