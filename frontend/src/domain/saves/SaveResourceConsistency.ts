import { maximumMana } from "../game/Mana";
import { DEFAULT_PLAYER_MAX_HEALTH } from "../game/PlayerStats";
import { HEALTH_PER_LEVEL } from "../game/Progression";
import {
	MONSTER_EFFECT_KINDS,
	PLAYER_EFFECT_KINDS,
} from "../game/TimedEffects";
import { equipmentBonuses } from "../items/EquipmentBonuses";
import { savedLevel, unique } from "./SaveConsistencyHelpers";
import type { SaveSourceDocument } from "./SaveSource";

export const hasConsistentResources = (
	document: SaveSourceDocument,
): boolean => {
	const { state } = document;
	const { quest } = state;
	if ("gold" in state && quest.victory && quest.victory.gold !== state.gold)
		return false;
	if ("effects" in document.state) {
		const effects = document.state.effects;
		if (
			new Set(effects.map((effect) => `${effect.actorId}:${effect.kind}`))
				.size !== effects.length ||
			effects.some((effect) =>
				effect.actorId === "player"
					? effect.floorNumber !== null ||
						!PLAYER_EFFECT_KINDS.some((kind) => kind === effect.kind)
					: !MONSTER_EFFECT_KINDS.some((kind) => kind === effect.kind) ||
						!state.monsters.some(
							(actor) =>
								actor.id === effect.actorId &&
								actor.floorNumber === effect.floorNumber &&
								actor.health > 0,
						),
			)
		)
			return false;
	}
	if ("spellHotbar" in document.state) {
		const slots = document.state.spellHotbar.filter((spell) => spell !== null);
		if (
			new Set(slots).size !== slots.length ||
			slots.some((spell) => !document.state.knownSpells.includes(spell))
		)
			return false;
	}
	const level = savedLevel(document);
	const manaLimit =
		document.version < 3
			? 10 + 2 * Math.floor((level - 1) / 2)
			: maximumMana(
					state.progression,
					document.version >= 6 ? state.equipment : undefined,
					"effects" in state ? state.effects : [],
				);
	if (
		document.version < 3 &&
		state.activityHistory.entries.some(
			(entry) => entry.event.type === "level-gained" && entry.event.level > 5,
		)
	)
		return false;
	if (
		state.player.maxHealth !==
			DEFAULT_PLAYER_MAX_HEALTH +
				HEALTH_PER_LEVEL * (level - 1) +
				(document.version >= 6
					? equipmentBonuses(state.equipment).health
					: 0) ||
		state.player.health > state.player.maxHealth ||
		state.mana > manaLimit ||
		!unique(state.knownSpells) ||
		!unique(state.potionHotbar.filter((kind) => kind !== null))
	)
		return false;
	return true;
};
