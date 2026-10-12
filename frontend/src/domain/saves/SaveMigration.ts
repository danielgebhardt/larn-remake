import { maximumMana } from "../game/Mana";
import { HEALTH_PER_LEVEL, levelForExperience } from "../game/Progression";
import { createSpellHotbar } from "../game/SpellHotbar";
import type { SaveDocumentV1 } from "./SaveDocumentV1";
import type { SaveDocumentV2 } from "./SaveDocumentV2";
import type { SaveDocumentV3 } from "./SaveDocumentV3";
import type { SaveDocumentV4 } from "./SaveDocumentV4";
import type { SaveDocumentV5 } from "./SaveDocumentV5";
import type { SaveDocumentV6 } from "./SaveDocumentV6";
import type { SaveDocumentV7 } from "./SaveDocumentV7";

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

export const migrateSaveV3 = (legacy: SaveDocumentV3): SaveDocumentV4 => ({
	...legacy,
	version: 4,
	state: {
		...legacy.state,
		spellHotbar: createSpellHotbar(legacy.state.knownSpells),
	},
});

export const migrateSaveV4 = (legacy: SaveDocumentV4): SaveDocumentV5 => ({
	...legacy,
	version: 5,
	state: { ...legacy.state, effects: [] },
});

export const migrateSaveV5 = (legacy: SaveDocumentV5): SaveDocumentV6 => ({
	...legacy,
	version: 6,
	state: {
		...legacy.state,
		equipment: { ...legacy.state.equipment, leftRing: null, rightRing: null },
	},
});

export const migrateSaveV6 = (legacy: SaveDocumentV6): SaveDocumentV7 => ({
	...legacy,
	version: 7,
	state: {
		...legacy.state,
		monsters: legacy.state.monsters.map((monster) => ({
			...monster,
			lastDamagedTurn: null,
		})),
	},
});
