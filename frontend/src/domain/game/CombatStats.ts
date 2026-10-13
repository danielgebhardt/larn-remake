import type { Equipment } from "../items/Equipment";
import { equipmentBonuses } from "../items/EquipmentBonuses";
import { itemArmor, itemAttackBonus } from "../items/ItemValues";
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
	const weaponBonus = itemAttackBonus(equipment.mainHand);
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
	shield: itemArmor(equipment.offHand),
	chest: itemArmor(equipment.chest),
	head: itemArmor(equipment.head),
});
