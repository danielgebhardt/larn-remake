import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";
import { HOTBAR_SLOTS } from "../domain/items/PotionHotbar";

const props = {
	dungeon: [["."]],
	playerPosition: { row: 0, col: 0 },
	onMoveRequested: vi.fn(),
};
describe("Potion number keys", () => {
	it.each(HOTBAR_SLOTS)(
		"requests slot %i once and prevents the browser default",
		(slot) => {
			const onPotionRequested = vi.fn();
			render(
				<DungeonLayout {...props} onPotionRequested={onPotionRequested} />,
			);
			const event = createEvent.keyDown(window, {
				key: String(slot),
				cancelable: true,
			});
			fireEvent(window, event);
			expect(onPotionRequested).toHaveBeenCalledExactlyOnceWith(slot);
			expect(event.defaultPrevented).toBe(true);
		},
	);
	it.each([
		{ repeat: true },
		{ ctrlKey: true },
		{ metaKey: true },
		{ altKey: true },
	])("ignores repeats and modified shortcuts: %j", (modifiers) => {
		const onPotionRequested = vi.fn();
		render(<DungeonLayout {...props} onPotionRequested={onPotionRequested} />);
		fireEvent.keyDown(window, { key: "1", ...modifiers });
		expect(onPotionRequested).not.toHaveBeenCalled();
	});
	it("does not consume when gameplay is disabled", () => {
		const onPotionRequested = vi.fn();
		render(
			<DungeonLayout
				{...props}
				onPotionRequested={onPotionRequested}
				movementEnabled={false}
			/>,
		);
		fireEvent.keyDown(window, { key: "1" });
		expect(onPotionRequested).not.toHaveBeenCalled();
	});
	it.each([
		{ name: "input", control: <input aria-label="Control" /> },
		{
			name: "button",
			control: (
				<button type="button" aria-label="Control">
					Button
				</button>
			),
		},
		{
			name: "log",
			control: (
				<section role="log" aria-label="Control">
					History
				</section>
			),
		},
	])("leaves number keys to a focused $name", ({ control }) => {
		const onPotionRequested = vi.fn();
		render(
			<>
				{control}
				<DungeonLayout {...props} onPotionRequested={onPotionRequested} />
			</>,
		);
		const target = screen.getByLabelText("Control");
		const event = createEvent.keyDown(target, {
			key: "1",
			bubbles: true,
			cancelable: true,
		});
		fireEvent(target, event);
		expect(onPotionRequested).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
	});
	it("ignores an editable descendant", () => {
		const onPotionRequested = vi.fn();
		render(
			<>
				<div contentEditable suppressContentEditableWarning>
					<span>Editor</span>
				</div>
				<DungeonLayout {...props} onPotionRequested={onPotionRequested} />
			</>,
		);
		const target = screen.getByText("Editor");
		Object.defineProperty(target, "isContentEditable", { value: true });
		fireEvent.keyDown(target, { key: "1" });
		expect(onPotionRequested).not.toHaveBeenCalled();
	});
});
