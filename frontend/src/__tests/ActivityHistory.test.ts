// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	ACTIVITY_LOG_LIMIT,
	type ActivityEvent,
	appendActivityEvents,
	createActivityHistory,
} from "../domain/game/ActivityHistory.ts";

const hit = (turn: number): ActivityEvent => ({
	type: "player-hit",
	turn,
	monster: "goblin",
	damage: 2,
});

describe("Activity history", () => {
	it("starts empty and appends same-turn events in resolution order", () => {
		const initial = createActivityHistory();
		const events: ActivityEvent[] = [
			hit(8),
			{ type: "monster-hit", turn: 8, monster: "goblin", damage: 1 },
		];
		const history = appendActivityEvents(initial, events);
		expect(history.entries.map((entry) => entry.event)).toEqual(events);
		expect(history.entries.map((entry) => entry.id)).toEqual([0, 1]);
		expect(initial.entries).toEqual([]);
	});

	it("keeps only the most recent 100 entries without changing retained identities", () => {
		const full = appendActivityEvents(
			createActivityHistory(),
			Array.from({ length: ACTIVITY_LOG_LIMIT }, (_, index) => hit(index + 1)),
		);
		const next = appendActivityEvents(full, [hit(101)]);
		expect(next.entries).toHaveLength(100);
		expect(next.entries[0]).toBe(full.entries[1]);
		expect(next.entries.at(-1)).toEqual({ id: 100, event: hit(101) });
		expect(full.entries[0].event.turn).toBe(1);
	});

	it("bounds a single oversized batch and keeps future entry ids unique", () => {
		const history = appendActivityEvents(
			createActivityHistory(),
			Array.from({ length: 150 }, (_, index) => hit(index + 1)),
		);
		expect(history.entries).toHaveLength(100);
		expect(history.entries[0].id).toBe(50);
		expect(appendActivityEvents(history, [hit(151)]).entries.at(-1)?.id).toBe(
			150,
		);
	});

	it("reuses history when no events occur and starts fresh on reset", () => {
		const history = appendActivityEvents(createActivityHistory(), [hit(1)]);
		expect(appendActivityEvents(history, [])).toBe(history);
		expect(createActivityHistory()).toEqual({ entries: [], nextId: 0 });
	});
});
