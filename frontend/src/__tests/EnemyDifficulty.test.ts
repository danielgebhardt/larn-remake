// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { Difficulty } from "../domain/game/Difficulty";
import type { GameState } from "../domain/game/GameState";
import {
	MONSTER_DEFINITIONS,
	type Monster,
	type MonsterKind,
} from "../domain/monsters/Monster";
import { resolveMonsterPhase } from "../domain/monsters/MonsterTurns";
import { bruteEncounter } from "./BruteTestHelpers";
import { predictableAttackRolls } from "./ControlledCombatTestHelpers";

const encounter = (
	kind: MonsterKind,
	difficulty: Difficulty,
	intent: Monster["intent"] = { type: "idle" },
): GameState => {
	const state = bruteEncounter();
	return {
		...state,
		difficulty,
		turn: 1,
		objects: [],
		player: { health: 100, maxHealth: 100 },
		monsters: [
			{
				...state.monsters[0],
				kind,
				health: MONSTER_DEFINITIONS[kind].maxHealth,
				coordinate: { row: 4, col: kind === "orc" ? 5 : 7 },
				intent,
			},
		],
	};
};
describe("Enemy attacks under difficulty", () => {
	it.each([
		[0.75, 2, 1, 3],
		[1, 3, 1, 4],
		[1.25, 4, 2, 5],
	] as const)(
		"uses %s for melee, ranged and charges before the starting shield",
		(difficulty, melee, ranged, charge) => {
			const orc = resolveMonsterPhase(
				encounter("orc", difficulty),
				predictableAttackRolls,
			);
			const archer = resolveMonsterPhase(
				encounter("goblin-archer", difficulty),
				predictableAttackRolls,
			);
			const charger = resolveMonsterPhase(
				encounter("horned-charger", difficulty, {
					type: "preparing-charge",
					target: { row: 4, col: 4 },
				}),
				predictableAttackRolls,
			);
			expect(100 - orc.player.health).toBe(melee);
			expect(100 - archer.player.health).toBe(ranged);
			expect(100 - charger.player.health).toBe(charge);
		},
	);
	it.each([
		[0.75, 2, 5],
		[1, 3, 6],
		[1.25, 4, 8],
	] as const)(
		"uses %s for enemy spell/area damage while retaining their armor bypass",
		(difficulty, spell, area) => {
			const lowerRolls = () => ({
				d20: () => 20,
				damage: (min: number) => min,
			});
			const caster = resolveMonsterPhase(
				encounter("cultist", difficulty),
				lowerRolls,
			);
			const breath = resolveMonsterPhase(
				encounter("salamander", difficulty, {
					type: "preparing-area",
					target: { row: 4, col: 4 },
					radius: 1,
					element: "fire",
					remaining: 1,
				}),
				lowerRolls,
			);
			expect(100 - caster.player.health).toBe(spell);
			expect(100 - breath.player.health).toBe(area);
		},
	);
	it("uses scaled maximum health when a harder caster decides to heal", () => {
		const initial = encounter("cultist", 1.25);
		initial.monsters[0].health = 10;
		const after = resolveMonsterPhase(initial, predictableAttackRolls);
		expect(after.monsters[0].health).toBe(14);
		expect(after.player).toEqual(initial.player);
	});
	it.each([
		[0.75, 17],
		[1, 22],
		[1.25, 28],
	] as const)(
		"caps regeneration at %s difficulty's maximum of %i",
		(difficulty, maximum) => {
			const initial = encounter("troll", difficulty);
			initial.monsters[0].health = maximum - 1;
			const after = resolveMonsterPhase(initial, predictableAttackRolls);
			expect(after.monsters[0].health).toBe(maximum);
			expect(
				after.activityHistory.entries.some(
					(entry) =>
						entry.event.type === "monster-regenerated" &&
						entry.event.recovered === 1,
				),
			).toBe(true);
		},
	);
});
