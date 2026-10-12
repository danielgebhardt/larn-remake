import type { Coordinate } from "../dungeon/DungeonTypes";
import type { ConsumptionEvent } from "../items/Consumables";
import type { EquipmentChangeEvent } from "../items/EquipmentChanges";
import type { FloorItemEvent } from "../items/FloorItems";
import type { ItemKind } from "../items/Item";
import type { MonsterKind } from "../monsters/Monster.ts";
import type { SpellKind } from "./Spells";
import type { EffectKind } from "./TimedEffects";

export type ActivityEvent = { turn: number } & (
	| {
			type: "spell-hit";
			spell: SpellKind;
			monster: MonsterKind;
			damage: number;
	  }
	| {
			type: "condition-applied";
			monster: MonsterKind;
			condition: EffectKind;
			duration: number;
	  }
	| {
			type: "condition-hit";
			condition: EffectKind;
			monster: MonsterKind;
			damage: number;
	  }
	| {
			type: "player-condition-applied";
			condition: EffectKind;
			duration: number;
	  }
	| { type: "spell-repositioned"; spell: SpellKind; monster?: MonsterKind }
	| { type: "player-condition-hit"; condition: EffectKind; damage: number }
	| { type: "monster-regenerated"; monster: MonsterKind; recovered: number }
	| { type: "spell-healed"; spell: SpellKind; recovered: number }
	| {
			type:
				| "player-hit"
				| "monster-hit"
				| "monster-shot-hit"
				| "monster-heavy-hit";
			monster: MonsterKind;
			damage: number;
	  }
	| { type: "monster-prepared"; monster: MonsterKind; target: Coordinate }
	| {
			type:
				| "monster-heavy-missed"
				| "monster-heavy-avoided"
				| "monster-shot-missed"
				| "player-missed"
				| "monster-missed";
			monster: MonsterKind;
	  }
	| { type: "monster-died"; monster: MonsterKind }
	| { type: "experience-gained"; amount: number }
	| { type: "level-gained"; level: number; healthGain: number }
	| {
			type: "attribute-gained";
			attribute: "Strength" | "Dexterity" | "Intelligence";
			value: number;
	  }
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
