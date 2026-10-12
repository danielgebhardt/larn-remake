import type { Equipment } from "../items/Equipment";
import { equipmentBonuses } from "../items/EquipmentBonuses";
import { ITEM_DEFINITIONS } from "../items/Item";
import { deriveAttributes } from "./Attributes";
import { playerEffectBonuses } from "./EffectBonuses";
import { BASE_PLAYER_ATTACK_DAMAGE } from "./PlayerStats";
import type { Progression } from "./Progression";
import type { TimedEffect } from "./TimedEffects";

export const deriveCombatStats = (
	equipment: Equipment,
	progression: Progression,
	effects: readonly TimedEffect[] = [],
) => {
	const strengthBonus = deriveAttributes(
		progression,
		effects,
		equipment,
	).strengthModifier;
	const weaponBonus = equipment.mainHand
		? ITEM_DEFINITIONS[equipment.mainHand.kind].attackBonus
		: 0;
	const armor = Object.values(armorContributions(equipment)).reduce<number>(
		(sum, value) => sum + value,
		0,
	);
	return {
		baseAttack: BASE_PLAYER_ATTACK_DAMAGE,
		weaponBonus,
		strengthBonus,
		attack: BASE_PLAYER_ATTACK_DAMAGE + strengthBonus + weaponBonus,
		armor:
			armor +
			playerEffectBonuses(effects).armor +
			equipmentBonuses(equipment).armor,
	};
};

export const resolveIncomingDamage = (
	incoming: number,
	armor: number,
): number => Math.max(1, incoming - armor);

export const armorContributions = (equipment: Equipment) => ({
	shield: equipment.offHand
		? ITEM_DEFINITIONS[equipment.offHand.kind].armor
		: 0,
	chest: equipment.chest ? ITEM_DEFINITIONS[equipment.chest.kind].armor : 0,
	head: equipment.head ? ITEM_DEFINITIONS[equipment.head.kind].armor : 0,
});
