import { maximumMana } from "../game/Mana";
import { HEALTH_PER_LEVEL, levelForExperience } from "../game/Progression";
import type { SaveDocumentV1 } from "./SaveDocumentV1";
import type { SaveDocumentV2 } from "./SaveDocumentV2";
import type { SaveDocumentV3 } from "./SaveDocumentV3";

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

// Apply only after checking legacy capacities under legacy rules. Preserve XP,
// missing resources and death; expanding capacity must never revive the player.
export const migrateSaveV2 = (legacy: SaveDocumentV2): SaveDocumentV3 => {
	const beforeLevel = Math.min(
		5,
		levelForExperience(legacy.state.progression.experience),
	);
	const afterLevel = levelForExperience(legacy.state.progression.experience);
	const gain = HEALTH_PER_LEVEL * (afterLevel - beforeLevel);
	const player = {
		maxHealth: legacy.state.player.maxHealth + gain,
		health:
			legacy.state.player.health === 0 ? 0 : legacy.state.player.health + gain,
	};
	const legacyManaLimit = 10 + 2 * Math.floor((beforeLevel - 1) / 2);
	const victory = legacy.state.quest.victory;
	return {
		...legacy,
		version: 3,
		state: {
			...legacy.state,
			player,
			mana:
				legacy.state.mana +
				maximumMana(legacy.state.progression) -
				legacyManaLimit,
			quest: {
				...legacy.state.quest,
				victory: victory
					? { ...victory, level: afterLevel, health: player.health }
					: null,
			},
		},
	};
};
