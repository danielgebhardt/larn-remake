// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createEscapeReview, recordEscapeReview } from "../review-escape.mjs";

const state = (overrides = {}) => ({
	turn: 10,
	quest: { cureRecovered: false },
	run: { activeFloor: 20 },
	player: { health: 30 },
	mana: 15,
	progression: { experience: 2000 },
	gold: 500,
	monstersDefeated: 100,
	monsters: [{ id: "1:1" }],
	...overrides,
});
describe("Return journey diagnostic counters", () => {
	it("separates the pickup turn from return turns and counts spawns independently of defeats", () => {
		const review = createEscapeReview();
		const picked = state({ turn: 11, quest: { cureRecovered: true } });
		recordEscapeReview(review, state(), { type: "pickup" }, picked);
		expect(review.recovery).toMatchObject({ turn: 11, health: 30, mana: 15 });
		expect(review.returnTurns).toBe(0);
		const arrived = {
			...picked,
			turn: 12,
			monsters: [{ id: "1:1" }, { id: "19:10001" }, { id: "19:10002" }],
		};
		recordEscapeReview(review, picked, { type: "move" }, arrived);
		const defeated = {
			...arrived,
			turn: 13,
			monsters: [{ id: "1:1" }, { id: "19:10002" }],
			monstersDefeated: 101,
		};
		recordEscapeReview(review, arrived, { type: "consume" }, defeated);
		expect(review).toMatchObject({
			returnTurns: 2,
			addedEnemies: 2,
			defeatedEnemies: 1,
			potionsUsed: 1,
		});
		recordEscapeReview(review, defeated, { type: "assign-spell" }, defeated);
		expect(review.returnTurns).toBe(2);
	});
});
