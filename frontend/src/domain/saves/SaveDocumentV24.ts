import type { TownPotionStock } from "../town/TownEconomy";
import type { SaveDocumentV23 } from "./SaveDocumentV23";
export type SaveDocumentV24 = Omit<SaveDocumentV23, "version" | "state"> & {
	version: 24;
	state: SaveDocumentV23["state"] & { townPotionStock: TownPotionStock };
};
