import type { EscapeState } from "../game/Escape";
import type { SaveDocumentV13 } from "./SaveDocumentV13";
export type SaveDocumentV14 = Omit<SaveDocumentV13, "version" | "state"> & {
	version: 14;
	state: SaveDocumentV13["state"] & { escape: EscapeState | null };
};
