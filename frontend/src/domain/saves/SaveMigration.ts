import type { SaveDocumentV1 } from "./SaveDocumentV1";
import type { SaveDocumentV2 } from "./SaveDocumentV2";

// Only migrate a structurally and semantically valid v1 snapshot. Preserve
// played data; legacy monsters have no prepared attack to carry forward.
export const migrateSaveV1 = (legacy: SaveDocumentV1): SaveDocumentV2 => ({
	...legacy,
	version: 2,
	state: {
		...legacy.state,
		monsters: legacy.state.monsters.map(
			({ id, kind, floorNumber, coordinate, health }) => ({
				id,
				kind,
				floorNumber,
				coordinate,
				health,
				intent: { type: "idle" },
			}),
		),
	},
});
