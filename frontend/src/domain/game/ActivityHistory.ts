import type { ConsumptionEvent } from "../items/Consumables";
import type { EquipmentChangeEvent } from "../items/EquipmentChanges";
import type { FloorItemEvent } from "../items/FloorItems";
import type { ItemKind } from "../items/Item";
import type { MonsterKind } from "../monsters/Monster.ts";
import type { SpellKind } from "./Spells";

export type ActivityEvent = { turn: number } & (
	| {
			type: "spell-hit";
			spell: SpellKind;
			monster: MonsterKind;
			damage: number;
	  }
	| { type: "spell-healed"; spell: SpellKind; recovered: number }
	| { type: "player-hit"; monster: MonsterKind; damage: number }
	| { type: "monster-hit"; monster: MonsterKind; damage: number }
	| { type: "monster-shot-hit"; monster: MonsterKind; damage: number }
	| { type: "monster-shot-missed"; monster: MonsterKind }
	| { type: "monster-died"; monster: MonsterKind }
	| { type: "experience-gained"; amount: number }
	| { type: "level-gained"; level: number; healthGain: number }
	| {
			type: "attribute-gained";
			attribute: "Strength" | "Dexterity" | "Intelligence";
			value: number;
	  }
	| { type: "player-missed" | "monster-missed"; monster: MonsterKind }
	| { type: "player-died" }
	| { type: "quest-completed" }
	| { type: "entrance-reminder"; goalFloor: number }
	| EquipmentChangeEvent
	| FloorItemEvent
	| ConsumptionEvent
	| { type: "monster-loot"; monster: MonsterKind; item: ItemKind }
	| { type: "items-seen"; items: readonly ItemKind[] }
	| { type: "floor-changed"; fromFloor: number; toFloor: number }
);

export type ActivityEntry = { id: number; event: ActivityEvent };
export type ActivityHistory = {
	entries: readonly ActivityEntry[];
	nextId: number;
};
export const ACTIVITY_LOG_LIMIT = 100;

export const createActivityHistory = (): ActivityHistory => ({
	entries: [],
	nextId: 0,
});

export const appendActivityEvents = (
	history: ActivityHistory,
	events: readonly ActivityEvent[],
): ActivityHistory => {
	if (events.length === 0) return history;
	const added = events.map((event, index) => ({
		id: history.nextId + index,
		event,
	}));
	return {
		entries: [...history.entries, ...added].slice(-ACTIVITY_LOG_LIMIT),
		nextId: history.nextId + events.length,
	};
};
