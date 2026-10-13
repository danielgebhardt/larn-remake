// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	appendActivityEvents,
	createActivityHistory,
} from "../domain/game/ActivityHistory";
import { defeatRecap } from "../domain/game/DefeatRecap";

describe("Recent defeat damage", () => {
	it("includes charge, ranged and condition damage in event order without counting attacks on monsters", () => {
		const history = appendActivityEvents(createActivityHistory(), [
			{ type: "monster-hit", monster: "goblin", damage: 1, turn: 1 },
			{ type: "player-hit", monster: "goblin", damage: 6, turn: 9 },
			{
				type: "monster-charge-hit",
				monster: "horned-charger",
				damage: 5,
				turn: 9,
			},
			{
				type: "monster-shot-hit",
				monster: "goblin-archer",
				damage: 2,
				turn: 10,
			},
			{
				type: "player-condition-hit",
				condition: "poisoned",
				damage: 1,
				turn: 10,
			},
			{ type: "player-died", turn: 10 },
		]);
		expect(defeatRecap(history, 10).map(({ event }) => event.type)).toEqual([
			"monster-charge-hit",
			"monster-shot-hit",
			"player-condition-hit",
		]);
	});
	it("limits the recap to five entries before the death marker and handles missing legacy history", () => {
		const events = Array.from({ length: 7 }, () => ({
			type: "monster-hit" as const,
			monster: "goblin" as const,
			damage: 1,
			turn: 10,
		}));
		const history = appendActivityEvents(createActivityHistory(), [
			...events,
			{ type: "player-died", turn: 10 },
			{ type: "monster-hit", monster: "orc", damage: 5, turn: 11 },
		]);
		expect(defeatRecap(history, 11).map(({ id }) => id)).toEqual([
			2, 3, 4, 5, 6,
		]);
		expect(defeatRecap(createActivityHistory(), 1)).toEqual([]);
	});
});
