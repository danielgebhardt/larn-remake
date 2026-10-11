// Omniscient routing, useful gear only, and spell use without deliberate safe resting.
// This is a diagnostic policy, not a human player or a gameplay rule.
import { DEFAULT_FOG_CONFIGURATION } from "../src/domain/dungeon/RunConfiguration";
import { calculateVisibility } from "../src/domain/dungeon/Visibility";
import { maximumMana } from "../src/domain/game/Mana";
import { isSpellTarget } from "../src/domain/game/SpellCasting";
import { SPELL_DEFINITIONS } from "../src/domain/game/Spells";
import { BAG_CAPACITY } from "../src/domain/items/Bag";
import { equipmentSlotFor } from "../src/domain/items/Equipment";
import { compareEquipment } from "../src/domain/items/EquipmentComparison";
import { ITEM_DEFINITIONS } from "../src/domain/items/Item";
import { orthogonalDistance } from "../src/domain/monsters/MonsterLocations";

export function chooseSpellAwareAction(state, route) {
	const floor = state.run.floors[state.run.activeFloor - 1];
	const position = state.run.playerCoordinate;
	const active = state.monsters.filter(
		(monster) =>
			monster.floorNumber === floor.floorNumber && monster.health > 0,
	);
	const healing = state.bag.items.find(
		(item) => item.kind === "healing-potion",
	);
	if (
		state.player.health <= Math.max(5, Math.floor(state.player.maxHealth / 2))
	) {
		if (healing) return { type: "consume", itemId: healing.id };
		if (
			state.knownSpells.includes("heal") &&
			state.mana >= SPELL_DEFINITIONS.heal.cost
		)
			return { type: "cast", spell: "heal" };
	}
	const manaPotion = state.bag.items.find(
		(item) => item.kind === "mana-potion",
	);
	if (
		manaPotion &&
		state.mana <=
			maximumMana(state.progression) -
				ITEM_DEFINITIONS["mana-potion"].recovery.amount
	)
		return { type: "consume", itemId: manaPotion.id };
	const upgrade = state.bag.items.find(
		(item) => compareEquipment(item, state.equipment)?.label === "Better",
	);
	if (upgrade)
		return {
			type: "equip",
			itemId: upgrade.id,
			slot: equipmentSlotFor(upgrade),
		};
	if (
		state.knownSpells.includes("magic-missile") &&
		state.mana >= SPELL_DEFINITIONS["magic-missile"].cost
	) {
		const visible = calculateVisibility(
			floor.terrain,
			position,
			DEFAULT_FOG_CONFIGURATION.radius,
		);
		const targets = active
			.filter(
				(monster) =>
					isSpellTarget(state, monster) &&
					visible[monster.coordinate.row]?.[monster.coordinate.col],
			)
			.sort(
				(a, b) =>
					orthogonalDistance(a.coordinate, position) -
						orthogonalDistance(b.coordinate, position) ||
					a.id.localeCompare(b.id),
			);
		if (targets[0])
			return { type: "cast", spell: "magic-missile", targetId: targets[0].id };
	}
	if (state.quest.cureRecovered) {
		const destination =
			floor.floorNumber === 1
				? state.quest.entrance
				: floor.upStair?.coordinate;
		const path = destination ? route(destination) : null;
		return path?.length ? { type: "move", direction: path[0] } : null;
	}
	const adjacent = active.find(
		(monster) => orthogonalDistance(monster.coordinate, position) === 1,
	);
	if (adjacent) {
		const path = route(adjacent.coordinate);
		return path?.length ? { type: "move", direction: path[0] } : null;
	}
	const useful = state.floorItems.filter(
		(entry) =>
			entry.floorNumber === floor.floorNumber &&
			(entry.item.kind === "cure" ||
				(state.bag.items.length < BAG_CAPACITY &&
					(ITEM_DEFINITIONS[entry.item.kind].type === "potion" ||
						compareEquipment(entry.item, state.equipment)?.label ===
							"Better"))),
	);
	const here = useful.find(
		(entry) =>
			entry.coordinate.row === position.row &&
			entry.coordinate.col === position.col,
	);
	if (here) return { type: "pickup", itemId: here.item.id };
	const paths = [
		...active.map((monster) => monster.coordinate),
		...useful.map((entry) => entry.coordinate),
	]
		.map((target) => route(target))
		.filter((path) => path?.length)
		.sort((a, b) => a.length - b.length);
	const path =
		paths[0] ?? (floor.downStair ? route(floor.downStair.coordinate) : null);
	return path?.length ? { type: "move", direction: path[0] } : null;
}
