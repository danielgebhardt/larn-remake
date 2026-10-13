// @vitest-environment node
import { expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import {
	eligibleMonsterKinds,
	MONSTER_DEFINITIONS,
} from "../domain/monsters/Monster";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const ranges = [
	{ kind: "wyvern", min: 12, max: 20 },
	{ kind: "salamander", min: 12, max: 19 },
	{ kind: "frost-giant", min: 14, max: 20 },
	{ kind: "necromancer", min: 15, max: 20 },
	{ kind: "demon-warden", min: 17, max: 20 },
] as const;
it.each(ranges)(
	"$kind respects its deeper floor band and reward",
	({ kind, min, max }) => {
		expect(eligibleMonsterKinds(min - 1)).not.toContain(kind);
		expect(eligibleMonsterKinds(min)).toContain(kind);
		expect(eligibleMonsterKinds(max)).toContain(kind);
		expect(eligibleMonsterKinds(max + 1)).not.toContain(kind);
		expect(MONSTER_DEFINITIONS[kind].experienceReward).toBeGreaterThan(24);
	},
);
it("necromancers cast Shock without creating new actors", () => {
	const initial = {
		...createGameState(createCorridorEncounter()),
		monsters: [
			{
				id: "1:1",
				kind: "necromancer" as const,
				floorNumber: 1,
				coordinate: { row: 1, col: 4 },
				health: 28,
				intent: { type: "idle" as const },
			},
		],
	};
	const after = resolvePlayerAction(initial, { type: "wait" }, () => ({
		d20: () => 20,
		damage: (min) => min,
	})).state;
	expect(after.monsters).toHaveLength(1);
	expect(after.player.health).toBe(5);
	expect(after.activityHistory.entries.at(-1)?.event).toMatchObject({
		type: "monster-spell-hit",
		spell: "shock",
	});
});
it("retains at least twenty creature kinds as the bestiary expands", () =>
	expect(Object.keys(MONSTER_DEFINITIONS).length).toBeGreaterThanOrEqual(20));
