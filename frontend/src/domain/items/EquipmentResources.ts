import type { GameState } from "../game/GameState";
import { maximumMana } from "../game/Mana";
import type { Equipment } from "./Equipment";
import { equipmentBonuses } from "./EquipmentBonuses";
// Equipping grants capacity, never free recovery. Removing capacity clamps current resources.
export const resourcesAfterEquipmentChange = (
	state: GameState,
	equipment: Equipment,
): Pick<GameState, "player" | "mana"> => {
	const healthDelta =
		equipmentBonuses(equipment).health -
		equipmentBonuses(state.equipment).health;
	const maxHealth = state.player.maxHealth + healthDelta;
	return {
		player:
			healthDelta === 0
				? state.player
				: { maxHealth, health: Math.min(state.player.health, maxHealth) },
		mana: Math.min(state.mana, maximumMana(state.progression, equipment)),
	};
};
