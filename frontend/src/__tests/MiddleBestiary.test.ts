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
	{ kind: "ogre", min: 7, max: 15 },
	{ kind: "troll", min: 8, max: 17 },
	{ kind: "cultist", min: 7, max: 18 },
	{ kind: "stone-golem", min: 10, max: 20 },
	{ kind: "wraith", min: 10, max: 20 },
] as const;
it.each(ranges)(
	"$kind is available only in its mid-depth band and rewards a stronger encounter",
	({ kind, min, max }) => {
		expect(eligibleMonsterKinds(min - 1)).not.toContain(kind);
		expect(eligibleMonsterKinds(min)).toContain(kind);
		expect(eligibleMonsterKinds(max)).toContain(kind);
		expect(eligibleMonsterKinds(max + 1)).not.toContain(kind);
		expect(MONSTER_DEFINITIONS[kind].maxHealth).toBeGreaterThan(12);
		expect(MONSTER_DEFINITIONS[kind].experienceReward).toBeGreaterThan(12);
	},
);
it("ogres telegraph heavy attacks while stone golems resolve them on their slower cadence", () => {
	const initial = {
		...createGameState(createCorridorEncounter()),
		monsters: [
			{
				id: "1:1",
				kind: "ogre" as const,
				floorNumber: 1,
				coordinate: { row: 1, col: 2 },
				health: 20,
				intent: { type: "idle" as const },
			},
		],
	};
	const prepared = resolvePlayerAction(initial, { type: "wait" }).state;
	expect(prepared.monsters[0].intent.type).toBe("preparing-attack");
	const golem = {
		...initial,
		monsters: [
			{ ...initial.monsters[0], kind: "stone-golem" as const, health: 26 },
		],
	};
	const idle = resolvePlayerAction(golem, { type: "wait" }).state;
	expect(idle.monsters[0].intent.type).toBe("idle");
	const windup = resolvePlayerAction(idle, { type: "wait" }).state;
	expect(windup.monsters[0].intent.type).toBe("preparing-attack");
	const pause = resolvePlayerAction(windup, { type: "wait" }).state;
	expect(pause.monsters[0].intent.type).toBe("preparing-attack");
	expect(pause.player.health).toBe(10);
});
