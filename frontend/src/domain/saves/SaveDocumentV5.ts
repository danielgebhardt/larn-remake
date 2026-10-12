import type { TimedEffect } from "../game/TimedEffects";
import type { SaveDocumentV4 } from "./SaveDocumentV4";
export type SaveDocumentV5 = Omit<SaveDocumentV4, "version" | "state"> & {
	version: 5;
	state: SaveDocumentV4["state"] & { effects: readonly TimedEffect[] };
};
