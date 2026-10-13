import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";

const props = {
	dungeon: [["."]],
	playerPosition: { row: 0, col: 0 },
	onMoveRequested: vi.fn(),
};
describe("Expanded spell number keys", () => {
	it.each([
		["9", 5],
		["0", 6],
	])("maps %s to spell slot %i without activating potions", (key, slot) => {
		const spell = vi.fn(),
			potion = vi.fn();
		render(
			<DungeonLayout
				{...props}
				onSpellSlotRequested={spell}
				onPotionRequested={potion}
			/>,
		);
		fireEvent.keyDown(window, { key });
		expect(spell).toHaveBeenCalledExactlyOnceWith(slot);
		expect(potion).not.toHaveBeenCalled();
	});
	it.each(["9", "0"])(
		"respects paused gameplay, focus, repeats and modifiers for %s",
		(key) => {
			const spell = vi.fn();
			const view = render(
				<>
					<input aria-label="Editor" />
					<DungeonLayout {...props} onSpellSlotRequested={spell} />
				</>,
			);
			for (const modifiers of [
				{ repeat: true },
				{ ctrlKey: true },
				{ altKey: true },
				{ metaKey: true },
			])
				fireEvent.keyDown(window, { key, ...modifiers });
			fireEvent.keyDown(screen.getByLabelText("Editor"), { key });
			expect(spell).not.toHaveBeenCalled();
			view.rerender(
				<DungeonLayout
					{...props}
					onSpellSlotRequested={spell}
					movementEnabled={false}
				/>,
			);
			fireEvent.keyDown(window, { key });
			expect(spell).not.toHaveBeenCalled();
		},
	);
});
