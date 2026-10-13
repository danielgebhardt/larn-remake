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
import type { SaveDocumentV8 } from "./SaveDocumentV8";
import type { SaveDocumentV9 } from "./SaveDocumentV9";
import type { SaveDocumentV10 } from "./SaveDocumentV10";
import type { SaveDocumentV11 } from "./SaveDocumentV11";
import type { SaveDocumentV12 } from "./SaveDocumentV12";

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
		spellHotbar: createSpellHotbar(legacy.state.knownSpells).slice(0, 4),
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

export const migrateSaveV7 = (legacy: SaveDocumentV7): SaveDocumentV8 => ({
	...legacy,
	version: 8,
});

// Each adapter handles one version; callers validate the original rules first.
export const migratePlayedSave = (
	document:
		| SaveDocumentV3
		| SaveDocumentV4
		| SaveDocumentV5
		| SaveDocumentV6
		| SaveDocumentV7
		| SaveDocumentV8
		| SaveDocumentV9
		| SaveDocumentV10
		| SaveDocumentV11
		| SaveDocumentV12,
): SaveDocumentV12 => {
	if (document.version === 12) return document;
	const v4 = document.version === 3 ? migrateSaveV3(document) : document;
	const v5 = v4.version === 4 ? migrateSaveV4(v4) : v4;
	const v6 = v5.version === 5 ? migrateSaveV5(v5) : v5;
	const v7 = v6.version === 6 ? migrateSaveV6(v6) : v6;
	const v8 = v7.version === 7 ? migrateSaveV7(v7) : v7;
	const v9 = v8.version === 8 ? migrateSaveV8(v8) : v8;
	const v10 = v9.version === 9 ? migrateSaveV9(v9) : v9;
	const v11 = { ...v10, version: 11 as const };
	return {
		...v11,
		version: 12,
		state: {
			...v11.state,
			spellHotbar: [...v11.state.spellHotbar, null, null],
		},
	};
};

export const migrateSaveV8 = (legacy: SaveDocumentV8): SaveDocumentV9 => ({
	...legacy,
	version: 9,
	state: { ...legacy.state, objects: [] },
});

export const migrateSaveV9 = (legacy: SaveDocumentV9): SaveDocumentV10 => ({
	...legacy,
	version: 10,
	state: {
		...legacy.state,
		gold: 0,
		quest: {
			...legacy.state.quest,
			victory: legacy.state.quest.victory
				? { ...legacy.state.quest.victory, gold: 0 }
				: null,
		},
	},
});
