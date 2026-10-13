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
	hasConsistentHistory(document);
