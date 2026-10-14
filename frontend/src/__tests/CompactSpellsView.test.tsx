import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import SpellsView from "../components/game/SpellsView";
import type { SpellHotbar } from "../domain/game/SpellHotbar";
import { SPELL_DEFINITIONS, type SpellKind } from "../domain/game/Spells";

const props = {
	knownSpells: ["magic-missile", "heal", "frost-bolt"] as SpellKind[],
	slots: ["magic-missile", "heal", null, null, null, null] as SpellHotbar,
	assignmentsEnabled: true,
	mana: 10,
	progression: { experience: 0 },
};
describe("Compact spell library", () => {
	it("explains casting once and shows every learned spell's full rules without a disclosure", () => {
		render(
			<SpellsView
				{...props}
				knownSpells={Object.keys(SPELL_DEFINITIONS) as SpellKind[]}
				onAction={vi.fn()}
			/>,
		);
		expect(
			screen.getAllByRole("region", { name: "Spell controls" }),
		).toHaveLength(1);
		for (const definition of Object.values(SPELL_DEFINITIONS)) {
			const card = within(
				screen.getByRole("region", { name: definition.name }),
			);
			expect(
				card.getByText(definition.description, { exact: true }),
			).toBeVisible();
			expect(card.queryByText("Spell details")).not.toBeInTheDocument();
		}
		const frost = within(screen.getByRole("region", { name: "Frost Bolt" }));
		expect(
			frost.getByText(/cold damage.*Slowed.*3 active phases/i),
		).toBeVisible();
		expect(frost.getByText(/Range 5/)).toBeVisible();
		expect(frost.getByText("Damage 2–4 · 4 mana")).toBeVisible();
	});
	it("uses six number-only controls with descriptive names and a highlighted assignment", async () => {
		const onAction = vi.fn();
		const view = render(<SpellsView {...props} onAction={onAction} />);
		const card = within(screen.getByRole("region", { name: "Magic Missile" }));
		const controls = within(
			card.getByRole("group", { name: "Assign Magic Missile shortcut" }),
		);
		expect(
			controls.getAllByRole("button").map((button) => button.textContent),
		).toEqual(["5", "6", "7", "8", "9", "0"]);
		const assigned = controls.getByRole("button", {
			name: "Assign Magic Missile to key 5 (assigned)",
		});
		expect(assigned).toHaveAttribute("aria-pressed", "true");
		expect(assigned).toHaveClass("bg-primary");
		const next = controls.getByRole("button", {
			name: "Assign Magic Missile to key 7",
		});
		next.focus();
		await userEvent.setup().keyboard("{Enter}");
		expect(onAction).toHaveBeenCalledExactlyOnceWith({
			type: "assign-spell",
			slot: 3,
			spell: "magic-missile",
		});
		view.rerender(
			<SpellsView
				{...props}
				slots={[null, "heal", "magic-missile", null, null, null]}
				onAction={onAction}
			/>,
		);
		expect(
			controls.getByRole("button", {
				name: "Assign Magic Missile to key 7 (assigned)",
			}),
		).toHaveAttribute("aria-pressed", "true");
		expect(
			controls.getByRole("button", { name: "Assign Magic Missile to key 5" }),
		).toHaveAttribute("aria-pressed", "false");
	});
	it("disables assignment controls when the completed adventure forbids changing shortcuts", () => {
		render(
			<SpellsView {...props} assignmentsEnabled={false} onAction={vi.fn()} />,
		);
		const controls = within(
			screen.getByRole("group", { name: "Assign Magic Missile shortcut" }),
		);
		for (const button of controls.getAllByRole("button"))
			expect(button).toBeDisabled();
	});
});
