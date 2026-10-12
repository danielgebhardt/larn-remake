import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import ItemDetails from "../components/game/ItemDetails";
import { createEquipment } from "../domain/items/Equipment";

it("lets the player choose either ring slot explicitly", async () => {
	const onAction = vi.fn();
	render(
		<ItemDetails
			item={{ id: "ring:1", kind: "copper-ring" }}
			equipment={createEquipment()}
			alive
			onAction={onAction}
			afterAction={vi.fn()}
			potionHotbar={[null, null, null, null]}
		/>,
	);
	const user = userEvent.setup();
	await user.click(screen.getByRole("button", { name: "Equip in right ring" }));
	expect(onAction).toHaveBeenCalledWith({
		type: "equip",
		itemId: "ring:1",
		slot: "rightRing",
	});
	expect(
		screen.getByRole("button", { name: "Equip in left ring" }),
	).toBeVisible();
});

it("describes a magical ring's actual bonus instead of implying armor", () => {
	render(
		<ItemDetails
			item={{ id: "ring:int", kind: "ring-intelligence" }}
			equipment={createEquipment()}
			alive
			onAction={vi.fn()}
			afterAction={vi.fn()}
			potionHotbar={[null, null, null, null]}
		/>,
	);
	expect(screen.getByText("+2 intelligence")).toBeVisible();
	expect(screen.queryByText("Armor 0")).not.toBeInTheDocument();
});
