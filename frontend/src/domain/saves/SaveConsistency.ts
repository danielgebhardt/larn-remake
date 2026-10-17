import { isTownLocation } from "../town/TownLocation";
import { hasConsistentActors } from "./SaveActorConsistency";
import { hasConsistentGeometry } from "./SaveGeometryConsistency";
import { hasConsistentHistory } from "./SaveHistoryConsistency";
import { hasConsistentInventory } from "./SaveInventoryConsistency";
import { hasConsistentResources } from "./SaveResourceConsistency";
import type { SaveSourceDocument } from "./SaveSource";

// Shape validation precedes these cross-field invariants. Validate equipment
// ownership first, before resource calculations consult catalog bonuses.
export const isConsistentSave = (document: SaveSourceDocument): boolean =>
	hasConsistentInventory(document) &&
	hasConsistentResources(document) &&
	hasConsistentGeometry(document) &&
	hasConsistentActors(document) &&
	hasConsistentHistory(document) &&
	hasConsistentTown(document);

const hasConsistentTown = (document: SaveSourceDocument): boolean => {
	if (document.version !== 23 || document.state.town === null) return true;
	const { state } = document;
	return (
		isTownLocation(state.town) &&
		state.player.health > 0 &&
		!state.quest.victory &&
		!state.quest.cureRecovered &&
		!state.bag.items.some((item) => item.kind === "cure") &&
		state.run.activeFloor === 1 &&
		state.run.playerCoordinate.row === state.quest.entrance.row &&
		state.run.playerCoordinate.col === state.quest.entrance.col
	);
};
