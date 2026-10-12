import type { SpellHotbar } from "../game/SpellHotbar";
import type { SaveDocumentV3 } from "./SaveDocumentV3";
export type SaveDocumentV4 = Omit<SaveDocumentV3, "version" | "state"> & {
	version: 4;
	state: SaveDocumentV3["state"] & { spellHotbar: SpellHotbar };
};
