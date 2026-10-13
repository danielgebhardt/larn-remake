import { SPELL_DEFINITIONS } from "../game/Spells";
import { MONSTER_DEFINITIONS, type MonsterKind } from "./Monster";
export const monsterTraits = (kind: MonsterKind): readonly string[] => {
	const definition = MONSTER_DEFINITIONS[kind];
	const traits: string[] = [];
	if (definition.actionInterval && definition.actionInterval > 1)
		traits.push(`Acts every ${definition.actionInterval} turns.`);
	if (definition.preparesAttack)
		traits.push("Heavy strike: fixed tile, one response action to dodge.");
	if (definition.enemySpells)
		traits.push(
			`Spells: ${definition.enemySpells.map((spell) => SPELL_DEFINITIONS[spell].name).join(", ")}. One cast every ${definition.spellInterval ?? 3} turns; physical armor does not block magic.`,
		);
	else if (definition.rangedAttackRange)
		traits.push(
			`Ranged shots up to ${definition.rangedAttackRange} tiles; adjacent melee.`,
		);
	if (definition.regeneration)
		traits.push(
			`Regenerates ${definition.regeneration} health per phase. Damage stops recovery this phase and the next.`,
		);
	if (definition.onHitCondition)
		traits.push(
			"Landed hits poison: 1 damage per phase for 3 phases; refreshes without stacking.",
		);
	if (definition.chargeRange)
		traits.push(
			`Prepares a straight charge up to ${definition.chargeRange} tiles. Sidestep or interrupt it; it spends the following phase recovering.`,
		);
	if (definition.areaAttack) {
		const area = definition.areaAttack;
		traits.push(
			`${area.element} blast: range ${area.range}, radius ${area.radius}, ${area.radius + 1} response turns to leave the marked area.`,
		);
	}
	if (definition.resists?.length)
		traits.push(
			`Resists ${definition.resists.join(", ")}: half damage, minimum 1.`,
		);
	if (definition.weaknesses?.length)
		traits.push(`Weak to ${definition.weaknesses.join(", ")}: double damage.`);
	if (!traits.length) traits.push("Moves or attacks once per turn.");
	traits.push(
		"Remembers your last seen tile, searches briefly, then disengages. Walls and closed doors break sight.",
	);
	return traits;
};
