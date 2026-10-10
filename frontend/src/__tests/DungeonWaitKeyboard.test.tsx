import { createEvent, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";
import { FLOOR } from "../domain/dungeon/Tiles";

const props = {
	dungeon: [[FLOOR]],
	playerPosition: { row: 0, col: 0 },
	onMoveRequested: vi.fn(),
};

describe("Spacebar wait input", () => {
	it("requests one wait and prevents page scrolling without requesting movement", () => {
		const onWaitRequested = vi.fn();
		render(<DungeonLayout {...props} onWaitRequested={onWaitRequested} />);
		const event = createEvent.keyDown(window, { key: " ", cancelable: true });
		fireEvent(window, event);
		expect(onWaitRequested).toHaveBeenCalledTimes(1);
		expect(props.onMoveRequested).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(true);
	});
	it("suppresses held-key repeats while still preventing scroll", () => {
		const onWaitRequested = vi.fn();
		render(<DungeonLayout {...props} onWaitRequested={onWaitRequested} />);
		const event = createEvent.keyDown(window, {
			key: " ",
			repeat: true,
			cancelable: true,
		});
		fireEvent(window, event);
		expect(onWaitRequested).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(true);
	});
	it("ignores Spacebar while gameplay is disabled", () => {
		const onWaitRequested = vi.fn();
		render(
			<DungeonLayout
				{...props}
				onWaitRequested={onWaitRequested}
				movementEnabled={false}
			/>,
		);
		const event = createEvent.keyDown(window, { key: " ", cancelable: true });
		fireEvent(window, event);
		expect(onWaitRequested).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
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
			name: "link",
			control: (
				<a href="#map" aria-label="Control">
					Link
				</a>
			),
		},
		{
			name: "checkbox",
			control: <input type="checkbox" aria-label="Control" />,
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
			name: "activity log",
			control: (
				<section role="log" aria-label="Control">
					History
				</section>
			),
		},
	])(
		"leaves Spacebar to a focused $name without advancing gameplay",
		({ control }) => {
			const onWaitRequested = vi.fn();
			render(
				<>
					{control}
					<DungeonLayout {...props} onWaitRequested={onWaitRequested} />
				</>,
			);
			const target = screen.getByLabelText("Control");
			const event = createEvent.keyDown(target, {
				key: " ",
				bubbles: true,
				cancelable: true,
			});
			fireEvent(target, event);
			expect(onWaitRequested).not.toHaveBeenCalled();
			expect(event.defaultPrevented).toBe(false);
		},
	);
	it("leaves Spacebar to an editable child", () => {
		const onWaitRequested = vi.fn();
		render(
			<>
				<div contentEditable suppressContentEditableWarning>
					<span>Editable child</span>
				</div>
				<DungeonLayout {...props} onWaitRequested={onWaitRequested} />
			</>,
		);
		const target = screen.getByText("Editable child");
		// Match inherited browser editability, which jsdom does not implement.
		Object.defineProperty(target, "isContentEditable", { value: true });
		const event = createEvent.keyDown(target, {
			key: " ",
			bubbles: true,
			cancelable: true,
		});
		fireEvent(target, event);
		expect(onWaitRequested).not.toHaveBeenCalled();
		expect(event.defaultPrevented).toBe(false);
	});
});
