import { render, screen, within } from "@testing-library/react";
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
	expect(
		screen.getByText("Attribute details").closest("details"),
	).toHaveTextContent("Intelligence 10 → 12 (+2)");
	expect(comparison).toHaveTextContent("Maximum mana 10 → 12 (+2)");
	expect(comparison).toHaveTextContent("Gains and losses");
	expect(within(comparison).getByText("1 (−2)")).toHaveClass(
		"text-red-700",
		"dark:text-red-400",
	);
	expect(within(comparison).getByText("12 (+2)")).toHaveClass(
		"text-green-700",
		"dark:text-green-400",
	);
	expect(within(comparison).getByText("10 (0)")).toHaveClass("text-foreground");
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

it.each([
	["lower", "short-sword", 0, "1–3", "text-red-700", "dark:text-red-400"],
	["unchanged", "iron-sword", 0, "2–4", "text-foreground", "text-foreground"],
	["higher", "short-sword", 3, "4–6", "text-green-700", "dark:text-green-400"],
] as const)(
	"colors a %s replacement damage range",
	(_direction, kind, enchantment, range, lightColor, darkColor) => {
		render(
			<ItemDetails
				item={{
					id: "candidate",
					kind,
					...(enchantment ? { enchantment } : {}),
				}}
				comparisonContext={createComparisonContext(
					createEquipment({ id: "worn", kind: "iron-sword" }),
				)}
				alive
				onAction={vi.fn()}
				afterAction={vi.fn()}
				potionHotbar={[null, null, null, null]}
			/>,
		);
		expect(
			within(screen.getByLabelText("Equipment comparison")).getByText(range),
		).toHaveClass(lightColor, darkColor);
	},
);
