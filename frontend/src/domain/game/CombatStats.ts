import type { Equipment } from "../items/Equipment";
import { ITEM_DEFINITIONS } from "../items/Item";
import { BASE_PLAYER_ATTACK_DAMAGE } from "./PlayerStats";

export const deriveCombatStats = (equipment: Equipment) => {
	const weaponBonus = equipment.mainHand
		? ITEM_DEFINITIONS[equipment.mainHand.kind].attackBonus
		: 0;
	const armor = equipment.offHand
		? ITEM_DEFINITIONS[equipment.offHand.kind].armor
		: 0;
	return {
		baseAttack: BASE_PLAYER_ATTACK_DAMAGE,
		weaponBonus,
		attack: BASE_PLAYER_ATTACK_DAMAGE + weaponBonus,
		armor,
	};
};

export const resolveIncomingDamage = (
	incoming: number,
	armor: number,
): number => Math.max(1, incoming - armor);
