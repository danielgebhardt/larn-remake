// @vitest-environment node
import { describe, expect, it } from "vitest";
import { formatActivityEvent } from "../components/game/ActivityMessages";
import { createGameState } from "../domain/game/GameState";
import { MONSTER_DEFINITIONS } from "../domain/monsters/Monster";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

describe("Progression activity narrative", () => {
	it("explains each crossed level and attribute before loot and retaliation", () => {
		const initial = createGameState(createCorridorEncounter());
		const before = {
			...initial,
			run: { ...initial.run, playerCoordinate: { row: 1, col: 2 } },
			monsters: [
				{
					intent: { type: "idle" as const },
					id: "1:1",
					kind: "orc" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 3 },
					health: 1,
				},
				{
					intent: { type: "idle" as const },
					id: "1:2",
					kind: "goblin" as const,
					floorNumber: 1,
					coordinate: { row: 1, col: 1 },
					health: 4,
				},
			],
		};
		// One oversized fixture reward exercises all milestone messages together.
		const originalReward = MONSTER_DEFINITIONS.orc.experienceReward;
		MONSTER_DEFINITIONS.orc.experienceReward = 120;
		try {
			const after = resolvePlayerActionWithHits(before, {
				type: "move",
				direction: "right",
			}).state;
			const events = after.activityHistory.entries.map((entry) => entry.event);
			expect(
				events
					.filter((event) => event.type !== "monster-loot")
					.map((event) => event.type),
			).toEqual([
				"player-hit",
				"monster-died",
				"experience-gained",
				"level-gained",
				"attribute-gained",
				"level-gained",
				"attribute-gained",
				"attribute-gained",
				"level-gained",
				"attribute-gained",
				"level-gained",
				"attribute-gained",
				"attribute-gained",
				"monster-hit",
			]);
			const messages = events.map(formatActivityEvent);
			expect(messages).toContain("Turn 1 — You gain 120 XP.");
			expect(messages).toContain("Turn 1 — Strength increases to 14.");
			expect(messages).toContain("Turn 1 — Dexterity increases to 14.");
			expect(after.progression.experience).toBe(120);
			expect(after.player).toEqual({ health: 17, maxHealth: 18 });
		} finally {
			MONSTER_DEFINITIONS.orc.experienceReward = originalReward;
		}
	});
});
