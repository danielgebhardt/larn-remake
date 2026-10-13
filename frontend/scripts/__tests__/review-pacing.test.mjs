// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mixedEncounter } from "../../src/__tests/TacticalReplayTestHelpers";
import { appendActivityEvents } from "../../src/domain/game/ActivityHistory";
import { createPacingReview, recordPacingTurn } from "../review-pacing.mjs";

describe("Per-floor pacing visits", () => {
	it("ignores rejected actions and separates repeated visits and return travel", () => {
		const start = mixedEncounter();
		const review = createPacingReview(start);
		recordPacingTurn(review, start, { type: "wait" }, start);
		expect(review.visits[0].turns).toBe(0);
		const descended = {
			...start,
			turn: 1,
			run: { ...start.run, activeFloor: 5 },
		};
		recordPacingTurn(
			review,
			start,
			{ type: "move", direction: "down" },
			descended,
		);
		const returned = {
			...descended,
			turn: 2,
			quest: { ...start.quest, cureRecovered: true },
			run: start.run,
		};
		recordPacingTurn(
			review,
			descended,
			{ type: "move", direction: "up" },
			returned,
		);
		expect(
			review.visits.map(({ floor, phase, turns }) => ({ floor, phase, turns })),
		).toEqual([
			{ floor: 4, phase: "descent", turns: 1 },
			{ floor: 5, phase: "descent", turns: 1 },
			{ floor: 4, phase: "return", turns: 0 },
		]);
		expect(review.visits[2].arrival.turn).toBe(2);
	});
	it("counts a combat turn once, kills and actual supplies used", () => {
		const start = {
			...mixedEncounter(),
			bag: { items: [{ id: "bottle", kind: "healing-potion" }] },
		};
		const after = {
			...start,
			turn: 1,
			activityHistory: appendActivityEvents(start.activityHistory, [
				{ type: "monster-hit", turn: 1, monster: "goblin", damage: 1 },
				{ type: "monster-hit", turn: 1, monster: "orc", damage: 3 },
				{ type: "monster-died", turn: 1, monster: "goblin" },
			]),
		};
		const review = createPacingReview(start);
		recordPacingTurn(
			review,
			start,
			{ type: "consume", itemId: "bottle" },
			after,
		);
		expect(review.visits[0]).toMatchObject({
			turns: 1,
			combatTurns: 1,
			kills: 1,
			suppliesUsed: { "healing-potion": 1 },
			damageReceived: 4,
		});
	});
});
