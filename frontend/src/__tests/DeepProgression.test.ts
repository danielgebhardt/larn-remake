// @vitest-environment node
import { expect, it } from "vitest";
import {
	gainExperience,
	levelForExperience,
	MAX_PLAYER_LEVEL,
	progressionProgress,
} from "../domain/game/Progression";

it("retains early milestones and spreads the upper levels over increasingly larger rewards", () => {
	expect(MAX_PLAYER_LEVEL).toBe(20);
	for (const [xp, level] of [
		[0, 1],
		[10, 2],
		[30, 3],
		[60, 4],
		[100, 5],
		[199, 5],
		[200, 6],
		[320, 7],
		[3699, 19],
		[3700, 20],
		[100000, 20],
	])
		expect(levelForExperience(xp)).toBe(level);
	expect(progressionProgress({ experience: 100 })).toEqual({
		level: 5,
		earned: 0,
		needed: 100,
		remaining: 100,
	});
});
it("awards growth only through twenty while preserving wounds and input ownership", () => {
	const player = { health: 3, maxHealth: 10 };
	const grown = gainExperience({ experience: 0 }, player, 3700);
	expect(grown.player).toEqual({ health: 41, maxHealth: 48 });
	expect(grown.levels).toEqual(Array.from({ length: 19 }, (_, i) => i + 2));
	const capped = gainExperience(grown.progression, grown.player, 100);
	expect(capped.player).toBe(grown.player);
	expect(capped.levels).toEqual([]);
	expect(player).toEqual({ health: 3, maxHealth: 10 });
});
