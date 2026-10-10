import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ActivityLog from "../components/game/ActivityLog.tsx";
import {
	type ActivityEvent,
	appendActivityEvents,
	createActivityHistory,
} from "../domain/game/ActivityHistory.ts";

describe("Activity log presentation", () => {
	it("shows an accessible empty log before combat events exist", () => {
		render(<ActivityLog history={createActivityHistory()} />);
		const log = screen.getByRole("log", { name: "Activity log" });
		expect(log).toHaveAttribute("aria-live", "polite");
		expect(log).toHaveAttribute("aria-relevant", "additions");
		expect(within(log).getByText("No activity yet.")).toBeVisible();
	});

	it("formats combat events with turns and preserves their order", () => {
		const events: ActivityEvent[] = [
			{ type: "player-hit", turn: 8, monster: "goblin", damage: 2 },
			{ type: "monster-hit", turn: 8, monster: "goblin", damage: 1 },
			{ type: "player-hit", turn: 9, monster: "goblin", damage: 2 },
			{ type: "monster-died", turn: 9, monster: "goblin" },
			{ type: "player-died", turn: 10 },
		];
		render(
			<ActivityLog
				history={appendActivityEvents(createActivityHistory(), events)}
			/>,
		);
		expect(
			screen.getAllByRole("listitem").map((entry) => entry.textContent),
		).toEqual([
			"Turn 8 — You hit the goblin for 2 damage.",
			"Turn 8 — The goblin hits you for 1 damage.",
			"Turn 9 — You hit the goblin for 2 damage.",
			"Turn 9 — The goblin dies.",
			"Turn 10 — You die.",
		]);
	});
});
