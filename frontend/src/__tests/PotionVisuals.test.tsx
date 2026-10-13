import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ItemIcon from "../components/items/ItemIcon";
import type { PotionKind } from "../domain/items/PotionHotbar";

const icon = (kind: PotionKind) => {
	const { container, unmount } = render(<ItemIcon kind={kind} />);
	const svg = container.querySelector("svg");
	if (!svg) throw new Error(`Missing potion SVG for ${kind}`);
	const result = {
		color: svg.getAttribute("class"),
		bottle: svg.querySelector("path")?.getAttribute("d"),
		strength: svg.querySelector('[data-strength="greater"]') !== null,
		hidden: svg.getAttribute("aria-hidden"),
	};
	unmount();
	return result;
};
describe("Potion visual identities", () => {
	it("uses different bottle silhouettes and colors for health, mana and antidote", () => {
		const health = icon("healing-potion");
		const mana = icon("mana-potion");
		const antidote = icon("antidote");
		expect(health.color).toContain("text-item-potion");
		expect(mana.color).toContain("text-item-mana");
		expect(antidote.color).toContain("text-item-antidote");
		expect(new Set([health.bottle, mana.bottle, antidote.bottle]).size).toBe(3);
		expect([health.hidden, mana.hidden, antidote.hidden]).toEqual([
			"true",
			"true",
			"true",
		]);
	});
	it("marks greater potions while preserving their family's silhouette and color", () => {
		for (const [ordinary, greater] of [
			["healing-potion", "greater-healing-potion"],
			["mana-potion", "greater-mana-potion"],
		] as const) {
			const regular = icon(ordinary);
			const strong = icon(greater);
			expect(strong.bottle).toBe(regular.bottle);
			expect(strong.color).toBe(regular.color);
			expect(regular.strength).toBe(false);
			expect(strong.strength).toBe(true);
		}
	});
});
