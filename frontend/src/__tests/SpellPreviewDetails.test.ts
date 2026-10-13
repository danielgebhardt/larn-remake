// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	spellEffectDetails,
	spellTargetDetails,
} from "../domain/game/SpellDetails";
import { SPELL_DEFINITIONS } from "../domain/game/Spells";
import { mixedEncounter } from "./TacticalReplayTestHelpers";

describe("Actionable spell details", () => {
	it("shows adjusted damage and defenses using actual spell resistance rules", () => {
		const base = mixedEncounter();
		const target = { ...base.monsters[0], kind: "iron-champion" as const };
		const state = { ...base, monsters: [target] };
		expect(spellTargetDetails(state, "magic-missile", target)).toContain(
			"arcane resisted",
		);
		expect(spellTargetDetails(state, "magic-missile", target)).toContain(
			"Damage 1–2",
		);
	});
	it("does not inspect hidden, dead, inactive or out-of-range targets", () => {
		const state = mixedEncounter();
		const target = state.monsters[0];
		expect(spellTargetDetails(state, "magic-missile", target, [])).toBeNull();
		expect(
			spellTargetDetails(state, "magic-missile", { ...target, health: 0 }),
		).toBeNull();
		expect(
			spellTargetDetails(state, "magic-missile", { ...target, floorNumber: 1 }),
		).toBeNull();
		expect(
			spellTargetDetails(state, "magic-missile", {
				...target,
				coordinate: { row: 50, col: 50 },
			}),
		).toBeNull();
	});
	it("puts damage-spell condition duration on the card without expanding details", () => {
		expect(spellEffectDetails(SPELL_DEFINITIONS["frost-bolt"])).toMatch(
			/cold.*Slowed.*3 active phases/i,
		);
		expect(spellEffectDetails(SPELL_DEFINITIONS.sleep)).toMatch(
			/damage wakes.*cancels prepared/i,
		);
	});
});
