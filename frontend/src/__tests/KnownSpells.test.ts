// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createGameState } from "../domain/game/GameState";
import { SPELL_DEFINITIONS, spellKnowledgeError } from "../domain/game/Spells";
import { resolvePlayerActionWithHits } from "./ControlledCombatTestHelpers";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

describe("Run-owned spell knowledge", () => {
	it("starts with both spells in stable order and resets independently", () => {
		const run = createCorridorEncounter();
		const initial = createGameState(run);
		expect(initial.knownSpells).toEqual(["magic-missile", "heal"]);
		expect(createGameState(run).knownSpells).not.toBe(initial.knownSpells);
		expect(SPELL_DEFINITIONS["magic-missile"]).toMatchObject({
			mode: "targeted",
			cost: 3,
			range: 6,
		});
		expect(SPELL_DEFINITIONS.heal).toMatchObject({ mode: "self", cost: 4 });
	});
	it("retains knowledge across stairs and does not infer spells from level", () => {
		const initial = createGameState(createCorridorEncounter());
		const before = {
			...initial,
			knownSpells: ["heal"] as const,
			progression: { experience: 100 },
			monsters: [],
			run: { ...initial.run, playerCoordinate: { row: 1, col: 11 } },
		};
		const after = resolvePlayerActionWithHits(before, {
			type: "move",
			direction: "right",
		}).state;
		expect(after.knownSpells).toBe(before.knownSpells);
		expect(after.run.activeFloor).toBe(2);
		expect(spellKnowledgeError(after.knownSpells, "magic-missile")).toMatch(
			/not learned/,
		);
		expect(spellKnowledgeError(after.knownSpells, "heal")).toBeUndefined();
		expect(spellKnowledgeError(after.knownSpells, "unknown")).toMatch(
			/Unknown spell/,
		);
	});
});
