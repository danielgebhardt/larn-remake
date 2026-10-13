import type { Difficulty } from "../game/Difficulty";
import type { SaveDocumentV19 } from "./SaveDocumentV19";

// Difficulty belongs to the saved run configuration; runtime state derives it.
export type SaveDocumentV20 = Omit<
	SaveDocumentV19,
	"version" | "configuration"
> & {
	version: 20;
	configuration: SaveDocumentV19["configuration"] & { difficulty: Difficulty };
};
