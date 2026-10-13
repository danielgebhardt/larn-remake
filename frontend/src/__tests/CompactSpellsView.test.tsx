import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SpellsView from "../components/game/SpellsView";
import type { SpellHotbar } from "../domain/game/SpellHotbar";
import type { SpellKind } from "../domain/game/Spells";

const known: SpellKind[] = ["magic-missile", "heal", "frost-bolt"];
const props = {
	knownSpells: known,
	slots: ["magic-missile", "heal", null, null] as SpellHotbar,
	assignmentsEnabled: true,
	mana: 10,
	progression: { experience: 0 },
};
describe("Compact spell library", () => {
	it("explains controls once and keeps individual descriptions available on demand", async () => {
		render(<SpellsView {...props} onAction={vi.fn()} />);
		expect(
			screen.getAllByRole("region", { name: "Spell controls" }),
		).toHaveLength(1);
		const card = within(screen.getByRole("region", { name: "Magic Missile" }));
		expect(card.getByText(/Range 6/)).toBeVisible();
		const description = card.getByText(/A homing bolt/);
		expect(description).not.toBeVisible();
		await userEvent.setup().click(card.getByText("Spell details"));
		expect(description).toBeVisible();
	});
	it("makes assignment and the selected shortcut explicit", async () => {
		const onAction = vi.fn();
		const view = render(<SpellsView {...props} onAction={onAction} />);
		const card = within(screen.getByRole("region", { name: "Magic Missile" }));
		expect(card.getByText("Assigned 5")).toBeVisible();
		expect(card.getByText("Assigned 5")).toHaveClass("bg-primary");
		expect(card.getByText("Assign 7")).not.toHaveClass("bg-primary");
		await userEvent.setup().click(card.getByText("Assign 7"));
		expect(onAction).toHaveBeenCalledWith({
			type: "assign-spell",
			slot: 3,
			spell: "magic-missile",
		});
		view.rerender(
			<SpellsView
				{...props}
				slots={[null, "heal", "magic-missile", null]}
				onAction={onAction}
			/>,
		);
		expect(card.getByText("Assigned 7")).toBeVisible();
		expect(card.getByText("Assigned 7")).toHaveClass("bg-primary");
		expect(card.getByText("Assign 5")).not.toHaveClass("bg-primary");
		expect(card.getByText("Assign 5")).toBeVisible();
	});
});
