import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import ItemDetails from "../components/game/ItemDetails";
import { createEquipment } from "../domain/items/Equipment";

it("explains the robe's armor loss and Intelligence gain without calling it lower", () => {
	render(
		<ItemDetails
			item={{ id: "robe", kind: "scholar-robe" }}
			equipment={createEquipment(null, null, {
				id: "plate",
				kind: "plate-armor",
			})}
			alive
			onAction={vi.fn()}
			afterAction={vi.fn()}
			potionHotbar={[null, null, null, null]}
		/>,
	);
	const comparison = screen.getByLabelText("Equipment comparison");
	expect(comparison).toHaveTextContent("Tradeoff");
	expect(comparison).toHaveTextContent("Armor 1 vs equipped 3 (−2)");
	expect(comparison).toHaveTextContent("Intelligence 2 vs equipped 0 (+2)");
	expect(comparison).toHaveTextContent("Mana capacity 2 vs equipped 0 (+2)");
	expect(comparison).toHaveTextContent("Gains and losses");
});
it("shows a comparison for each ring slot rather than assuming the left one", () => {
	render(
		<ItemDetails
			item={{ id: "int", kind: "ring-intelligence" }}
			equipment={createEquipment(null, null, null, null, {
				id: "str",
				kind: "ring-strength",
			})}
			alive
			onAction={vi.fn()}
			afterAction={vi.fn()}
			potionHotbar={[null, null, null, null]}
		/>,
	);
	const comparisons = screen.getAllByLabelText("Equipment comparison");
	expect(comparisons).toHaveLength(2);
	expect(comparisons[0]).toHaveTextContent("Tradeoff · Left ring");
	expect(comparisons[1]).toHaveTextContent("Better · Right ring");
});
