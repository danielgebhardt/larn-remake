import type { TownLocation } from "../town/TownLocation";
import type { SaveDocumentV22 } from "./SaveDocumentV22";
// Retain the actual positive-floor dungeon while the player owns a town location.
export type SaveDocumentV23 = Omit<SaveDocumentV22, "version" | "state"> & {
	version: 23;
	state: SaveDocumentV22["state"] & { town: TownLocation | null };
};
