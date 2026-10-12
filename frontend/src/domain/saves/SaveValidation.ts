import type { Coordinate } from "../dungeon/DungeonTypes";
import {
	CONFIGURATION_LIMITS,
	FOG_RADIUS_LIMITS,
} from "../dungeon/RunConfiguration";
import { MAX_SEED } from "../dungeon/Seed";
import {
	ACTIVITY_LOG_LIMIT,
	type ActivityEvent,
} from "../game/ActivityHistory";
import { maximumMana } from "../game/Mana";
import { DEFAULT_PLAYER_MAX_HEALTH } from "../game/PlayerStats";
import {
	HEALTH_PER_LEVEL,
	levelForExperience,
	MAX_PLAYER_LEVEL,
} from "../game/Progression";
import { SPELL_DEFINITIONS } from "../game/Spells";
import { BAG_CAPACITY } from "../items/Bag";
import {
	EQUIPMENT_SLOT_LABELS,
	type EquipmentSlot,
	equipmentSlotFor,
} from "../items/Equipment";
import { ITEM_DEFINITIONS } from "../items/Item";
import { MONSTER_DEFINITIONS } from "../monsters/Monster";
import { protectedFloorLocations } from "../monsters/MonsterLocations";
import type { SaveDocument, SaveResult } from "./SaveFormat";

// Small runtime schemas keep untrusted JSON out of the typed game model.
type Schema = (value: unknown) => boolean;
const record = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);
const integer =
	(min = 0, max = Number.MAX_SAFE_INTEGER): Schema =>
	(value) =>
		typeof value === "number" &&
		Number.isSafeInteger(value) &&
		value >= min &&
		value <= max;
const text: Schema = (value) =>
	typeof value === "string" && value.length > 0 && value.length <= 200;
const boolean: Schema = (value) => typeof value === "boolean";
const oneOf =
	(values: readonly unknown[]): Schema =>
	(value) =>
		values.includes(value);
const optional =
	(schema: Schema): Schema =>
	(value) =>
		value === undefined || schema(value);
const nullable =
	(schema: Schema): Schema =>
	(value) =>
		value === null || schema(value);
const array =
	(schema: Schema, min = 0, max = 10000): Schema =>
	(value) =>
		Array.isArray(value) &&
		value.length >= min &&
		value.length <= max &&
		value.every(schema);
const object =
	(fields: Record<string, Schema>): Schema =>
	(value) =>
		record(value) &&
		Object.entries(fields).every(([key, schema]) => schema(value[key]));
const natural = integer();
const floorNumber = integer(1, CONFIGURATION_LIMITS.floorCount.max);
const index = integer(0, CONFIGURATION_LIMITS.rows.max - 1);
const coordinate = object({ row: index, col: index });
const region = object({
	startRow: index,
	endRow: index,
	startCol: index,
	endCol: index,
});
const partition =
	(depth = 0): Schema =>
	(value) =>
		depth <= 30 &&
		object({
			region,
			room: optional(region),
			children: optional(array(partition(depth + 1), 2, 2)),
		})(value);
const itemKind = oneOf(Object.keys(ITEM_DEFINITIONS));
const monsterKind = oneOf(Object.keys(MONSTER_DEFINITIONS));
const spellKind = oneOf(Object.keys(SPELL_DEFINITIONS));
const slot = oneOf(Object.keys(EQUIPMENT_SLOT_LABELS));
const item = object({ id: text, kind: itemKind });
const stair = object({
	coordinate,
	destinationFloor: floorNumber,
	arrivalCoordinate: coordinate,
});
const victory = object({
	seed: integer(0, MAX_SEED),
	floors: floorNumber,
	turns: natural,
	monstersDefeated: natural,
	health: integer(1),
	level: integer(1, MAX_PLAYER_LEVEL),
	experience: natural,
});

const eventFields = {
	"spell-hit": { spell: spellKind, monster: monsterKind, damage: natural },
	"spell-healed": { spell: spellKind, recovered: natural },
	"player-hit": { monster: monsterKind, damage: natural },
	"monster-hit": { monster: monsterKind, damage: natural },
	"monster-died": { monster: monsterKind },
	"player-missed": { monster: monsterKind },
	"monster-missed": { monster: monsterKind },
	"experience-gained": { amount: natural },
	"level-gained": { level: integer(1, MAX_PLAYER_LEVEL), healthGain: natural },
	"attribute-gained": {
		attribute: oneOf(["Strength", "Dexterity", "Intelligence"]),
		value: natural,
	},
	"player-died": {},
	"quest-completed": {},
	"entrance-reminder": { goalFloor: floorNumber },
	"item-equipped": { item: itemKind, slot, replaced: optional(itemKind) },
	"item-unequipped": { item: itemKind, slot, replaced: optional(itemKind) },
	"item-picked-up": { item: itemKind },
	"item-dropped": { item: itemKind },
	"item-consumed": { item: itemKind, recovered: natural },
	"monster-loot": { monster: monsterKind, item: itemKind },
	"items-seen": { items: array(itemKind, 1) },
	"floor-changed": { fromFloor: floorNumber, toFloor: floorNumber },
} satisfies Record<ActivityEvent["type"], Record<string, Schema>>;
const event: Schema = (value) =>
	record(value) &&
	typeof value.type === "string" &&
	Object.hasOwn(eventFields, value.type) &&
	object({
		turn: natural,
		...eventFields[value.type as ActivityEvent["type"]],
	})(value);
const configuration = object({
	rows: integer(CONFIGURATION_LIMITS.rows.min, CONFIGURATION_LIMITS.rows.max),
	cols: integer(CONFIGURATION_LIMITS.cols.min, CONFIGURATION_LIMITS.cols.max),
	floorCount: integer(
		CONFIGURATION_LIMITS.floorCount.min,
		CONFIGURATION_LIMITS.floorCount.max,
	),
	minPartitionSize: integer(1, 100),
	roomPadding: integer(0, 100),
	minRoomSize: integer(1, 100),
	maxRoomAspectRatio: (value) =>
		typeof value === "number" &&
		Number.isFinite(value) &&
		value >= 1 &&
		value <= 100,
});
const documentShape = object({
	version: oneOf([1]),
	savedAt: (value) =>
		text(value) &&
		typeof value === "string" &&
		Number.isFinite(Date.parse(value)),
	configuration,
	fog: object({
		enabled: boolean,
		radius: integer(FOG_RADIUS_LIMITS.min, FOG_RADIUS_LIMITS.max),
	}),
	state: object({
		run: object({
			seed: integer(0, MAX_SEED),
			activeFloor: floorNumber,
			playerCoordinate: coordinate,
			floors: array(
				object({
					floorNumber,
					terrain: array(
						(value) =>
							typeof value === "string" && /^[.#]{10,100}$/.test(value),
						10,
						100,
					),
					partitions: partition(),
					rooms: array(region, 1),
					corridors: array(array(coordinate)),
					upStair: optional(stair),
					downStair: optional(stair),
				}),
				5,
				20,
			),
		}),
		turn: natural,
		mana: natural,
		knownSpells: array(spellKind, 0, Object.keys(SPELL_DEFINITIONS).length),
		player: object({ health: natural, maxHealth: integer(1) }),
		progression: object({ experience: natural }),
		quest: object({
			goalFloor: floorNumber,
			entrance: coordinate,
			cureRecovered: boolean,
			victory: nullable(victory),
		}),
		monstersDefeated: natural,
		equipment: object({
			mainHand: nullable(item),
			offHand: nullable(item),
			chest: nullable(item),
			head: nullable(item),
		}),
		bag: object({ items: array(item, 0, BAG_CAPACITY) }),
		potionHotbar: array(
			nullable(
				oneOf(
					Object.keys(ITEM_DEFINITIONS).filter(
						(key) =>
							ITEM_DEFINITIONS[key as keyof typeof ITEM_DEFINITIONS].type ===
							"potion",
					),
				),
			),
			4,
			4,
		),
		floorItems: array(object({ item, floorNumber, coordinate })),
		monsters: array(
			object({
				id: text,
				kind: monsterKind,
				floorNumber,
				coordinate,
				health: integer(1),
			}),
			0,
			10000,
		),
		activityHistory: object({
			entries: array(object({ id: natural, event }), 0, ACTIVITY_LOG_LIMIT),
			nextId: natural,
		}),
	}),
	explored: array(
		object({
			floorNumber,
			rows: array(
				(value) => typeof value === "string" && /^[01]{10,100}$/.test(value),
				10,
				100,
			),
		}),
		0,
		20,
	),
});

const consistent = (document: SaveDocument): boolean => {
	const { state, configuration: config } = document;
	const { run, quest } = state;
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
				HEALTH_PER_LEVEL *
					(levelForExperience(state.progression.experience) - 1) ||
		state.player.health > state.player.maxHealth ||
		state.mana > maximumMana(state.progression) ||
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
	const allItems = [
		...state.bag.items,
		...Object.values(state.equipment).filter((entry) => entry !== null),
		...state.floorItems.map((entry) => entry.item),
	];
	if (!unique(allItems.map((entry) => entry.id))) return false;
	for (const [name, entry] of Object.entries(state.equipment))
		if (entry && equipmentSlotFor(entry) !== (name as EquipmentSlot))
			return false;
	if (
		state.bag.items.some((entry) => entry.kind === "cure") ||
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
			quest.victory.level !==
				levelForExperience(state.progression.experience) ||
			quest.victory.monstersDefeated !== state.monstersDefeated)
	)
		return false;
	return true;
};

export const validateSaveDocument = (
	data: unknown,
): SaveResult<SaveDocument> => {
	if (record(data) && data.version !== 1)
		return {
			ok: false,
			error: "This save uses an unsupported format version.",
		};
	if (!documentShape(data))
		return {
			ok: false,
			error: "This save contains invalid or missing adventure data.",
		};
	// Every field above has been checked before crossing this boundary.
	const document = data as SaveDocument;
	return consistent(document)
		? { ok: true, value: document }
		: { ok: false, error: "This save contains inconsistent adventure data." };
};
