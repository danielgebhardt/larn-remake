import type { EquipmentChangeEvent } from "../items/EquipmentChanges";
import type { FloorItemEvent } from "../items/FloorItems";
import type { ItemKind } from "../items/Item";
import type { MonsterKind } from "../monsters/Monster.ts";

export type ActivityEvent = { turn: number } & (
	| { type: "player-hit"; monster: MonsterKind; damage: number }
	| { type: "monster-hit"; monster: MonsterKind; damage: number }
	| { type: "monster-died"; monster: MonsterKind }
	| { type: "player-died" }
	| EquipmentChangeEvent
	| FloorItemEvent
	| { type: "monster-loot"; monster: MonsterKind; item: ItemKind }
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
