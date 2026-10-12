// @vitest-environment node
import { describe, expect, it } from "vitest";
import { createEquipment } from "../domain/items/Equipment";
import { compareEquipment } from "../domain/items/EquipmentComparison";
import type { ItemKind } from "../domain/items/Item";

const item = (kind: ItemKind) => ({ id: kind, kind });
describe("Comparing gear with its compatible equipped slot", () => {
	it.each([
		["iron-sword", "short-sword", "Better", 1],
		["iron-sword", "iron-sword", "Same", 0],
		["short-sword", "iron-sword", "Lower", -1],
	] as const)(
		"compares carried %s against equipped %s",
		(carried, equipped, label, delta) => {
			expect(
				compareEquipment(item(carried), createEquipment(item(equipped))),
			).toMatchObject({ slot: "mainHand", stat: "Attack bonus", label, delta });
		},
	);
	it("compares chest armor only against chest, ignoring a stronger helmet and shield", () => {
		const equipment = createEquipment(
			null,
			item("wooden-shield"),
			item("leather-armor"),
			item("iron-helmet"),
		);
		expect(compareEquipment(item("chain-armor"), equipment)).toMatchObject({
			slot: "chest",
			stat: "Armor",
			carriedValue: 2,
			equippedValue: 1,
			delta: 1,
			label: "Better",
		});
	});
	it("compares a helmet to the head slot rather than total armor", () => {
		const equipment = createEquipment(
			null,
			item("wooden-shield"),
			item("chain-armor"),
			item("iron-helmet"),
		);
		expect(compareEquipment(item("leather-cap"), equipment)).toMatchObject({
			slot: "head",
			carriedValue: 1,
			equippedValue: 2,
			delta: -1,
			label: "Lower",
		});
	});
	it("treats a useful item for an empty slot as an upgrade over zero", () => {
		expect(
			compareEquipment(item("wooden-shield"), createEquipment()),
		).toMatchObject({
			slot: "offHand",
			carriedValue: 1,
			equippedValue: 0,
			delta: 1,
			label: "Better",
		});
	});
	it.each(["healing-potion", "cure"] as const)(
		"does not compare %s",
		(kind) => {
			expect(compareEquipment(item(kind), createEquipment())).toBeNull();
		},
	);
});
