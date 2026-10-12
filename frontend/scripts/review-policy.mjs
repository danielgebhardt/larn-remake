// Omniscient routing, useful gear only, and spell use without deliberate safe resting.
// This is a diagnostic policy, not a human player or a gameplay rule.
import { DEFAULT_FOG_CONFIGURATION } from "../src/domain/dungeon/RunConfiguration";
import { calculateVisibility } from "../src/domain/dungeon/Visibility";
import { maximumMana } from "../src/domain/game/Mana";
import { SPELL_DEFINITIONS } from "../src/domain/game/Spells";
import { BAG_CAPACITY } from "../src/domain/items/Bag";
import { compareEquipment } from "../src/domain/items/EquipmentComparison";
import { ITEM_DEFINITIONS } from "../src/domain/items/Item";
import { orthogonalDistance } from "../src/domain/monsters/MonsterLocations";
import { shrineTerms } from "../src/domain/objects/DungeonShrines";
import { navigationRun } from "../src/domain/objects/NavigationTerrain";
import { chooseDamageSpell } from "./review-spells.mjs";

export function chooseSpellAwareAction(state, route) {
	const floor = navigationRun(state).floors[state.run.activeFloor - 1];
	const position = state.run.playerCoordinate;
	const active = state.monsters.filter(
		(monster) =>
			monster.floorNumber === floor.floorNumber && monster.health > 0,
	);
	const antidote = state.bag.items.find((item) => item.kind === "antidote");
	if (
		antidote &&
		state.effects.some((e) => e.actorId === "player" && e.kind === "poisoned")
	)
		return { type: "consume", itemId: antidote.id };
	const healing = state.bag.items.find((item) => {
		const d = ITEM_DEFINITIONS[item.kind];
		return "recovery" in d && d.recovery.resource === "health";
	});
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
	const manaPotion = state.bag.items.find((item) => {
		const d = ITEM_DEFINITIONS[item.kind];
		return "recovery" in d && d.recovery.resource === "mana";
	});
	if (
		manaPotion &&
		state.mana <=
			maximumMana(state.progression, state.equipment) -
				ITEM_DEFINITIONS[manaPotion.kind].recovery.amount
	)
		return { type: "consume", itemId: manaPotion.id };
	const upgrade = state.bag.items.find(
		(item) => compareEquipment(item, state.equipment)?.label === "Better",
	);
	if (upgrade)
		return {
			type: "equip",
			itemId: upgrade.id,
			slot: compareEquipment(upgrade, state.equipment).slot,
		};
	const visible = calculateVisibility(
		floor.terrain,
		position,
		DEFAULT_FOG_CONFIGURATION.radius,
	);
	const seen = active.filter(
		(actor) => visible[actor.coordinate.row]?.[actor.coordinate.col],
	);
	const spell = chooseDamageSpell(state, seen);
	if (spell) return spell;
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
				(ITEM_DEFINITIONS[entry.item.kind].type === "spellbook" &&
					!state.knownSpells.includes(
						ITEM_DEFINITIONS[entry.item.kind].teaches,
					)) ||
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
	// Conservative discoveries only; optional gambling remains a human choice.
	const choiceFor = (object) => {
		if (object.activated) return undefined;
		if (object.kind === "chest") return null;
		if (object.kind === "archive") return "read";
		if (object.kind === "shrine" && state.gold >= shrineTerms(object).gold)
			return "offer";
		if (
			object.kind === "fountain" &&
			(state.player.health < state.player.maxHealth ||
				state.mana < maximumMana(state.progression, state.equipment))
		)
			return "sip";
		if (
			object.kind === "reliquary" &&
			state.player.health > 6 &&
			state.bag.items.length < BAG_CAPACITY
		)
			return "unseal";
		if (object.kind === "gold") return null;
		return undefined;
	};
	const discoveries = seen.length
		? []
		: state.objects.filter(
				(o) =>
					o.floorNumber === floor.floorNumber && choiceFor(o) !== undefined,
			);
	const nearby = discoveries.find(
		(o) => o.kind !== "gold" && orthogonalDistance(o.coordinate, position) <= 1,
	);
	if (nearby)
		return {
			type: "interact",
			objectId: nearby.id,
			...(choiceFor(nearby) ? { choice: choiceFor(nearby) } : {}),
		};
	const paths = [
		...active.map((monster) => monster.coordinate),
		...useful.map((entry) => entry.coordinate),
		...discoveries.map((object) => object.coordinate),
	]
		.map((target) => route(target))
		.filter((path) => path?.length)
		.sort((a, b) => a.length - b.length);
	const path =
		paths[0] ?? (floor.downStair ? route(floor.downStair.coordinate) : null);
	return path?.length ? { type: "move", direction: path[0] } : null;
}
