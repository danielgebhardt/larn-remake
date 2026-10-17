// @vitest-environment node

import { describe, expect, it } from "vitest";
import {
	assignSpell,
	createSpellHotbar,
	type SpellSlot,
} from "../domain/game/SpellHotbar";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../domain/saves/SaveFormat";
import { historicalSaveText, savedAdventure } from "./SaveTestHelpers";

describe("Six spell shortcuts", () => {
	it("provides six slots and moves, replaces and clears the sixth assignment", () => {
		const known = ["magic-missile", "heal", "ember-bolt"] as const;
		const initial = createSpellHotbar(known);
		expect(initial).toEqual([
			"magic-missile",
			"heal",
			"ember-bolt",
			null,
			null,
			null,
		]);
		const moved = assignSpell(initial, known, {
			type: "assign-spell",
			slot: 6 as SpellSlot,
			spell: "heal",
		});
		expect(moved).toEqual([
			"magic-missile",
			null,
			"ember-bolt",
			null,
			null,
			"heal",
		]);
		if (!Array.isArray(moved)) throw new Error("Sixth assignment failed");
		const replaced = assignSpell(moved, known, {
			type: "assign-spell",
			slot: 6 as SpellSlot,
			spell: "ember-bolt",
		});
		expect(replaced).toEqual([
			"magic-missile",
			null,
			null,
			null,
			null,
			"ember-bolt",
		]);
		if (!Array.isArray(replaced)) throw new Error("Sixth replacement failed");
		expect(
			assignSpell(replaced, known, {
				type: "assign-spell",
				slot: 6 as SpellSlot,
				spell: null,
			}),
		).toEqual(["magic-missile", null, null, null, null, null]);
	});
	it("preserves four legacy assignments and appends two empty slots", () => {
		const current = savedAdventure();
		const old = {
			...current,
			version: 11,
			state: {
				...current.state,
				spellHotbar: [null, "heal", null, "magic-missile"],
			},
		};
		const parsed = parseSave(historicalSaveText(old));
		expect(
			parseSave(
				historicalSaveText({
					...old,
					state: {
						...old.state,
						spellHotbar: [null, "heal", null, "magic-missile", null, null],
					},
				}),
			).ok,
		).toBe(false);
		expect(parsed.ok).toBe(true);
		if (!parsed.ok) throw new Error(parsed.error);
		expect(parsed.value.state.spellHotbar).toEqual([
			null,
			"heal",
			null,
			"magic-missile",
			null,
			null,
		]);
		const restored = restoreSave(parsed.value);
		const state = {
			...restored.state,
			spellHotbar: ["magic-missile", null, null, null, null, "heal"] as const,
		};
		const roundTrip = parseSave(
			serializeSave(
				createSaveDocument(
					state,
					restored.exploration,
					restored.configuration,
					restored.fog,
				),
			),
		);
		expect(roundTrip.ok).toBe(true);
		if (!roundTrip.ok) throw new Error(roundTrip.error);
		expect(roundTrip.value.state.spellHotbar).toEqual(state.spellHotbar);
	});
	it.each([
		["four slots", ["magic-missile", "heal", null, null]],
		["duplicate in sixth", ["heal", null, null, null, null, "heal"]],
		[
			"unlearned in fifth",
			["magic-missile", "heal", null, null, "ember-bolt", null],
		],
	])("rejects malformed current saves: %s", (_, slots) => {
		const document = savedAdventure();
		expect(
			parseSave(
				historicalSaveText({
					...document,
					state: { ...document.state, spellHotbar: slots },
				}),
			).ok,
		).toBe(false);
	});
});
