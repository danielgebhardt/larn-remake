import type { Coordinate } from "../dungeon/DungeonTypes";
import type { AreaElement } from "../game/DamageElements";
import type { SaveDocumentV7 } from "./SaveDocumentV7";

// Freeze the persisted intent union rather than inheriting future runtime variants.
type SavedActorV8 = Omit<
	SaveDocumentV7["state"]["monsters"][number],
	"intent"
> & {
	intent:
		| SaveDocumentV7["state"]["monsters"][number]["intent"]
		| {
				type: "preparing-area";
				target: Coordinate;
				radius: 1 | 2;
				element: AreaElement;
				remaining: number;
		  };
};
export type SaveDocumentV8 = Omit<SaveDocumentV7, "version" | "state"> & {
	version: 8;
	state: Omit<SaveDocumentV7["state"], "monsters"> & {
		monsters: readonly SavedActorV8[];
	};
};
