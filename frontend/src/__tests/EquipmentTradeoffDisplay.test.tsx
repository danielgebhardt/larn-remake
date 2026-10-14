import { render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import ItemDetails from "../components/game/ItemDetails";
import { createEquipment } from "../domain/items/Equipment";
import { createComparisonContext } from "./EquipmentComparisonTestHelpers";

it("explains the robe's armor loss and Intelligence gain without calling it lower", () => {
	render(
		<ItemDetails
			item={{ id: "robe", kind: "scholar-robe" }}
			comparisonContext={createComparisonContext(
				createEquipment(null, null, {
					id: "plate",
					kind: "plate-armor",
				}),
			)}
			alive
			onAction={vi.fn()}
			afterAction={vi.fn()}
			potionHotbar={[null, null, null, null]}
		/>,
	);
	const comparison = screen.getByLabelText("Equipment comparison");
	expect(comparison).toHaveTextContent("Tradeoff");
	expect(comparison).toHaveTextContent("Armor 3 → 1 (−2)");
	expect(screen.getByText("Intelligence 10 → 12 (+2)")).toBeInTheDocument();
	expect(comparison).toHaveTextContent("Maximum mana 10 → 12 (+2)");
	expect(comparison).toHaveTextContent("Gains and losses");
});
it("shows a comparison for each ring slot rather than assuming the left one", () => {
	render(
		<ItemDetails
			item={{ id: "int", kind: "ring-intelligence" }}
			comparisonContext={createComparisonContext(
				createEquipment(null, null, null, null, {
					id: "str",
					kind: "ring-strength",
				}),
			)}
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
