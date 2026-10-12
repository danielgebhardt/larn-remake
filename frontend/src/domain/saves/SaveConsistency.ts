import type { Coordinate } from "../dungeon/DungeonTypes";
import { hasLineOfSight } from "../dungeon/Visibility";
import { maximumMana } from "../game/Mana";
import { DEFAULT_PLAYER_MAX_HEALTH } from "../game/PlayerStats";
import { HEALTH_PER_LEVEL, levelForExperience } from "../game/Progression";
import {
	MONSTER_EFFECT_KINDS,
	PLAYER_EFFECT_KINDS,
} from "../game/TimedEffects";
import { type EquipmentSlot, fitsEquipmentSlot } from "../items/Equipment";
import { equipmentBonuses } from "../items/EquipmentBonuses";
import { ITEM_DEFINITIONS } from "../items/Item";
import { MONSTER_DEFINITIONS } from "../monsters/Monster";
import {
	orthogonalDistance,
	protectedFloorLocations,
} from "../monsters/MonsterLocations";
import type { SaveDocumentV1 } from "./SaveDocumentV1";
import type { SaveDocumentV2 } from "./SaveDocumentV2";
import type { SaveDocumentV3 } from "./SaveDocumentV3";
import type { SaveDocumentV4 } from "./SaveDocumentV4";
import type { SaveDocumentV5 } from "./SaveDocumentV5";
import type { SaveDocumentV6 } from "./SaveDocumentV6";
import type { SaveDocumentV7 } from "./SaveDocumentV7";
import type { SaveDocumentV8 } from "./SaveDocumentV8";
import type { SaveDocumentV9 } from "./SaveDocumentV9";

export const isConsistentSave = (
	document:
		| SaveDocumentV1
		| SaveDocumentV2
		| SaveDocumentV3
		| SaveDocumentV4
		| SaveDocumentV5
		| SaveDocumentV6
		| SaveDocumentV7
		| SaveDocumentV8
		| SaveDocumentV9,
): boolean => {
	const { state, configuration: config } = document;
	const { run, quest } = state;
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
	const level =
		document.version < 3
			? Math.min(5, levelForExperience(state.progression.experience))
			: levelForExperience(state.progression.experience);
	const manaLimit =
		document.version < 3
			? 10 + 2 * Math.floor((level - 1) / 2)
			: maximumMana(
					state.progression,
					document.version >= 6 ? state.equipment : undefined,
				);
	if (
		document.version < 3 &&
		state.activityHistory.entries.some(
			(entry) => entry.event.type === "level-gained" && entry.event.level > 5,
		)
	)
		return false;
	const floorAt = (number: number) => run.floors[number - 1];
	const walkable = (number: number, point: Coordinate) =>
		floorAt(number)?.terrain[point.row]?.[point.col] === ".";
	const same = (a: Coordinate, b: Coordinate) =>
		a.row === b.row && a.col === b.col;
	const unique = (values: readonly unknown[]) =>
		new Set(values).size === values.length;
	if (
		run.floors.length !== config.floorCount ||
		!walkable(run.activeFloor, run.playerCoordinate) ||
		quest.goalFloor !== config.floorCount ||
		!walkable(1, quest.entrance) ||
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
	for (const [i, floor] of run.floors.entries()) {
		if (
			floor.floorNumber !== i + 1 ||
			floor.terrain.length !== config.rows ||
			floor.terrain.some((row) => row.length !== config.cols)
		)
			return false;
		for (const [link, destination, reverse] of [
			[floor.upStair, i, "downStair"],
			[floor.downStair, i + 2, "upStair"],
		] as const) {
			if (destination < 1 || destination > run.floors.length) {
				if (link) return false;
				continue;
			}
			const counterpart = floorAt(destination)?.[reverse];
			if (
				!link ||
				!counterpart ||
				link.destinationFloor !== destination ||
				!walkable(i + 1, link.coordinate) ||
				!walkable(destination, link.arrivalCoordinate) ||
				!same(link.arrivalCoordinate, counterpart.coordinate) ||
				!same(link.coordinate, counterpart.arrivalCoordinate)
			)
				return false;
		}
		const boundedRegion = (r: {
			startRow: number;
			endRow: number;
			startCol: number;
			endCol: number;
		}) =>
			r.startRow <= r.endRow &&
			r.startCol <= r.endCol &&
			r.endRow < config.rows &&
			r.endCol < config.cols;
		if (
			!floor.rooms.every(boundedRegion) ||
			!floor.corridors.every((path) =>
				path.every((point) => walkable(i + 1, point)),
			)
		)
			return false;
	}
	if ("objects" in document.state) {
		const objects = document.state.objects;
		if (
			!unique(objects.map((object) => object.id)) ||
			!unique(
				objects.map(
					(object) =>
						`${object.floorNumber}:${object.coordinate.row}:${object.coordinate.col}`,
				),
			)
		)
			return false;
		for (const object of objects) {
			if (
				!object.id.startsWith(
					`floor:${object.floorNumber}:object:${object.kind}:`,
				) ||
				!walkable(object.floorNumber, object.coordinate) ||
				protectedFloorLocations(run, object.floorNumber).some((tile) =>
					same(tile, object.coordinate),
				) ||
				(object.floorNumber === 1 && same(object.coordinate, quest.entrance))
			)
				return false;
			if (
				object.kind === "door" &&
				!object.activated &&
				((object.floorNumber === run.activeFloor &&
					same(object.coordinate, run.playerCoordinate)) ||
					state.monsters.some(
						(actor) =>
							actor.floorNumber === object.floorNumber &&
							same(actor.coordinate, object.coordinate),
					))
			)
				return false;
		}
	}
	const allItems = [
		...state.bag.items,
		...Object.values(state.equipment).filter((entry) => entry !== null),
		...state.floorItems.map((entry) => entry.item),
	];
	if (!unique(allItems.map((entry) => entry.id))) return false;
	for (const [name, entry] of Object.entries(state.equipment))
		if (entry && !fitsEquipmentSlot(entry, name as EquipmentSlot)) return false;
	if (
		state.bag.items.some(
			(entry) =>
				entry.kind === "cure" ||
				ITEM_DEFINITIONS[entry.kind].type === "spellbook",
		) ||
		!state.floorItems.every((entry) =>
			walkable(entry.floorNumber, entry.coordinate),
		)
	)
		return false;
	const cures = state.floorItems.filter((entry) => entry.item.kind === "cure");
	if (
		quest.cureRecovered
			? cures.length !== 0
			: cures.length !== 1 || cures[0].floorNumber !== quest.goalFloor
	)
		return false;
	// Imported actors must preserve the same safe arrivals as live pursuit.
	const protectedLocations = new Map(
		run.floors.map((floor) => [
			floor.floorNumber,
			protectedFloorLocations(run, floor.floorNumber),
		]),
	);
	if (
		!unique(state.monsters.map((entry) => entry.id)) ||
		!unique(
			state.monsters.map(
				(entry) =>
					`${entry.floorNumber}:${entry.coordinate.row}:${entry.coordinate.col}`,
			),
		) ||
		!state.monsters.every(
			(entry) =>
				/^\d+:[1-9]\d*$/.test(entry.id) &&
				Number(entry.id.split(":")[0]) === entry.floorNumber &&
				walkable(entry.floorNumber, entry.coordinate) &&
				!protectedLocations
					.get(entry.floorNumber)
					?.some((location) => same(location, entry.coordinate)) &&
				entry.health <= MONSTER_DEFINITIONS[entry.kind].maxHealth &&
				!(
					entry.floorNumber === run.activeFloor &&
					same(entry.coordinate, run.playerCoordinate)
				),
		)
	)
		return false;
	if (
		document.version !== 1 &&
		!document.state.monsters.every(
			(monster) =>
				monster.intent.type === "idle" ||
				(monster.intent.type === "preparing-area"
					? (() => {
							const profile = MONSTER_DEFINITIONS[monster.kind].areaAttack;
							const intent = monster.intent;
							return (
								!!profile &&
								intent.radius === profile.radius &&
								intent.element === profile.element &&
								intent.remaining <= profile.radius + 1 &&
								walkable(monster.floorNumber, intent.target) &&
								orthogonalDistance(monster.coordinate, intent.target) <=
									profile.range &&
								hasLineOfSight(
									floorAt(monster.floorNumber).terrain.map((row) => [...row]),
									monster.coordinate,
									intent.target,
								)
							);
						})()
					: walkable(monster.floorNumber, monster.intent.target) &&
						orthogonalDistance(monster.coordinate, monster.intent.target) ===
							1),
		)
	)
		return false;
	if (
		!unique(document.explored.map((entry) => entry.floorNumber)) ||
		!document.explored.every(
			(entry) =>
				floorAt(entry.floorNumber) &&
				entry.rows.length === config.rows &&
				entry.rows.every((row) => row.length === config.cols),
		)
	)
		return false;
	const entries = state.activityHistory.entries;
	if (
		!entries.every(
			(entry, i) =>
				entry.id < state.activityHistory.nextId &&
				(!i || entry.id > entries[i - 1].id) &&
				entry.event.turn <= state.turn &&
				(!i || entry.event.turn >= entries[i - 1].event.turn),
		)
	)
		return false;
	if (
		quest.victory &&
		(!quest.cureRecovered ||
			run.activeFloor !== 1 ||
			!same(run.playerCoordinate, quest.entrance) ||
			quest.victory.seed !== run.seed ||
			quest.victory.floors !== run.floors.length ||
			quest.victory.turns !== state.turn ||
			quest.victory.health !== state.player.health ||
			quest.victory.experience !== state.progression.experience ||
			quest.victory.level !== level ||
			quest.victory.monstersDefeated !== state.monstersDefeated)
	)
		return false;
	return true;
};
