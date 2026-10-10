import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ActivityLog from "../components/game/ActivityLog.tsx";
import {
	type ActivityEvent,
	appendActivityEvents,
	createActivityHistory,
} from "../domain/game/ActivityHistory.ts";

const events = (count: number, start = 1): ActivityEvent[] =>
	Array.from({ length: count }, (_, index) => ({
		type: "player-hit",
		turn: start + index,
		monster: "goblin",
		damage: 2,
	}));
const readAt = (top: number) => {
	const viewport = screen.getByRole("log", { name: "Activity log" });
	viewport.scrollTop = top;
	fireEvent.scroll(viewport);
	return viewport;
};

// jsdom has no layout. Model three visible lines, each 24px tall, so these
// scenarios can verify scrolling rather than incidental CSS class names.
beforeEach(() => {
	vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(72);
	vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockImplementation(
		function (this: HTMLElement) {
			return this.querySelectorAll("[data-entry-id]").length * 24;
		},
	);
	vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
		function (this: HTMLElement) {
			const viewport = this.closest<HTMLElement>('[role="log"]');
			const index = this.hasAttribute("data-entry-id")
				? Array.from(this.parentElement?.children ?? []).indexOf(this)
				: -1;
			const top = index < 0 ? 0 : index * 24 - (viewport?.scrollTop ?? 0);
			return {
				top,
				bottom: top + (index < 0 ? 72 : 24),
				left: 0,
				right: 200,
				width: 200,
				height: index < 0 ? 72 : 24,
			} as DOMRect;
		},
	);
});
afterEach(() => vi.restoreAllMocks());

describe("Activity log scrolling", () => {
	it("follows new entries at the bottom without moving focus", () => {
		const history = appendActivityEvents(createActivityHistory(), events(10));
		const { rerender } = render(<ActivityLog history={history} />);
		const viewport = screen.getByRole("log", { name: "Activity log" });
		expect(viewport.scrollTop).toBe(168);
		rerender(
			<ActivityLog history={appendActivityEvents(history, events(1, 11))} />,
		);
		expect(viewport.scrollTop).toBe(192);
		expect(document.activeElement).toBe(document.body);
	});

	it("preserves an older reading position and resumes following after returning to the bottom", () => {
		const history = appendActivityEvents(createActivityHistory(), events(10));
		const { rerender } = render(<ActivityLog history={history} />);
		const viewport = readAt(48);
		viewport.focus();
		const next = appendActivityEvents(history, events(1, 11));
		rerender(<ActivityLog history={next} />);
		expect(viewport.scrollTop).toBe(48);
		expect(viewport).toHaveFocus();
		readAt(192);
		rerender(
			<ActivityLog history={appendActivityEvents(next, events(1, 12))} />,
		);
		expect(viewport.scrollTop).toBe(216);
	});

	it("keeps the same message in view when the history limit removes an earlier entry", () => {
		const history = appendActivityEvents(createActivityHistory(), events(100));
		const { rerender } = render(<ActivityLog history={history} />);
		const viewport = readAt(48);
		const message = screen.getByText(
			"Turn 3 — You hit the goblin for 2 damage.",
		);
		expect(message.getBoundingClientRect().top).toBe(0);
		rerender(
			<ActivityLog history={appendActivityEvents(history, events(1, 101))} />,
		);
		expect(viewport.scrollTop).toBe(24);
		expect(message.getBoundingClientRect().top).toBe(0);
	});

	it("shows the oldest remaining entry if the message being read is trimmed away", () => {
		const history = appendActivityEvents(createActivityHistory(), events(100));
		const { rerender } = render(<ActivityLog history={history} />);
		const viewport = readAt(48);
		rerender(
			<ActivityLog history={appendActivityEvents(history, events(100, 101))} />,
		);
		expect(viewport.scrollTop).toBe(0);
		expect(screen.getAllByRole("listitem")[0]).toHaveTextContent("Turn 101");
	});

	it("resets the reading position and follows again for a fresh run", () => {
		const history = appendActivityEvents(createActivityHistory(), events(10));
		const { rerender } = render(<ActivityLog history={history} />);
		const viewport = readAt(48);
		rerender(<ActivityLog history={createActivityHistory()} />);
		expect(viewport.scrollTop).toBe(0);
		rerender(
			<ActivityLog
				history={appendActivityEvents(createActivityHistory(), events(10))}
			/>,
		);
		expect(viewport.scrollTop).toBe(168);
	});
});
