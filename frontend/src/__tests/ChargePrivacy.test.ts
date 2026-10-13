// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	appendActivityEvents,
	createActivityHistory,
} from "../domain/game/ActivityHistory";
import { visibleThreatHistory } from "../domain/monsters/VisibleAwareness";

describe("Charge log visibility", () => {
	it.each([
		"monster-charge-prepared",
		"monster-alarm-prepared",
		"monster-alarm-sounded",
	] as const)("keeps old messages while excluding hidden %s", (type) => {
		const old = appendActivityEvents(createActivityHistory(), [
			{ type: "floor-changed", fromFloor: 2, toFloor: 1, turn: 1 },
		]);
		const updated = appendActivityEvents(old, [
			{
				type,
				actorId: "1:1",
				monster: "horned-charger",
				target: { row: 0, col: 1 },
				turn: 2,
			},
		]);
		const actor = {
			id: "1:1",
			kind: "horned-charger" as const,
			floorNumber: 1,
			coordinate: { row: 0, col: 0 },
			health: 14,
			intent: { type: "idle" as const },
		};
		expect(
			visibleThreatHistory(old, updated, [actor], 1, [[false, true]]),
		).toEqual(old);
		expect(visibleThreatHistory(old, updated, [actor], 1, [[true, true]])).toBe(
			updated,
		);
	});
});
