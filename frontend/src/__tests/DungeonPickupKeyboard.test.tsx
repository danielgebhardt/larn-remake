import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";

const props = {
	dungeon: [["."]],
	playerPosition: { row: 0, col: 0 },
	onMoveRequested: vi.fn(),
};
describe("G pickup input", () => {
	it.each(["g", "G"])(
		"requests pickup once with %s and prevents the browser default",
		(key) => {
			const onPickupRequested = vi.fn();
			render(
				<DungeonLayout {...props} onPickupRequested={onPickupRequested} />,
			);
			const event = createEvent.keyDown(window, { key, cancelable: true });
			fireEvent(window, event);
			expect(onPickupRequested).toHaveBeenCalledTimes(1);
			expect(event.defaultPrevented).toBe(true);
		},
	);
	it.each([
		{ repeat: true },
		{ ctrlKey: true },
		{ metaKey: true },
		{ altKey: true },
	])("ignores held keys and browser shortcuts: %j", (options) => {
		const onPickupRequested = vi.fn();
		render(<DungeonLayout {...props} onPickupRequested={onPickupRequested} />);
		fireEvent.keyDown(window, { key: "g", ...options });
		expect(onPickupRequested).not.toHaveBeenCalled();
	});
	it("ignores G while gameplay is disabled", () => {
		const onPickupRequested = vi.fn();
		render(
			<DungeonLayout
				{...props}
				onPickupRequested={onPickupRequested}
				movementEnabled={false}
			/>,
		);
		fireEvent.keyDown(window, { key: "g" });
		expect(onPickupRequested).not.toHaveBeenCalled();
	});
	it.each([
		{ name: "input", control: <input aria-label="Control" /> },
		{ name: "textarea", control: <textarea aria-label="Control" /> },
		{
			name: "button",
			control: (
				<button type="button" aria-label="Control">
					<span>Child</span>
				</button>
			),
		},
		{
			name: "select",
			control: (
				<select aria-label="Control">
					<option>Choice</option>
				</select>
			),
		},
		{
			name: "link",
			control: (
				<a href="#map" aria-label="Control">
					Link
				</a>
			),
		},
		{
			name: "activity log",
			control: (
				<section role="log" aria-label="Control">
					History
				</section>
			),
		},
	])("leaves G to a focused $name", ({ control }) => {
		const onPickupRequested = vi.fn();
		render(
			<>
				{control}
				<DungeonLayout {...props} onPickupRequested={onPickupRequested} />
			</>,
		);
		const target = screen.getByLabelText("Control");
		const event = createEvent.keyDown(target, {
			key: "g",
			bubbles: true,
			cancelable: true,
		});
		fireEvent(target, event);
		expect(onPickupRequested).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
	});
	it("ignores editable descendants", () => {
		const onPickupRequested = vi.fn();
		render(
			<>
				<div contentEditable suppressContentEditableWarning>
					<span>Editor</span>
				</div>
				<DungeonLayout {...props} onPickupRequested={onPickupRequested} />
			</>,
		);
		const target = screen.getByText("Editor");
		Object.defineProperty(target, "isContentEditable", { value: true });
		fireEvent.keyDown(target, { key: "g" });
		expect(onPickupRequested).not.toHaveBeenCalled();
	});
});
