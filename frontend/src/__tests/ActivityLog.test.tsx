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
	it("highlights milestones and danger without changing narration or order", () => {
		const events: ActivityEvent[] = [
			{ type: "experience-gained", turn: 3, amount: 5 },
			{ type: "level-gained", turn: 3, level: 2, healthGain: 2 },
			{ type: "attribute-gained", turn: 3, attribute: "Dexterity", value: 12 },
			{ type: "monster-hit", turn: 3, monster: "orc", damage: 2 },
			{ type: "player-died", turn: 4 },
			{ type: "quest-completed", turn: 5 },
		];
		render(
			<ActivityLog
				history={appendActivityEvents(createActivityHistory(), events)}
			/>,
		);
		const entries = screen.getAllByRole("listitem");
		expect(entries.map((entry) => entry.textContent)).toEqual([
			"Turn 3 — You gain 5 XP.",
			"Turn 3 — You reach level 2. Maximum and current health increase by 2.",
			"Turn 3 — Dexterity increases to 12.",
			"Turn 3 — The orc hits you for 2 damage.",
			"Turn 4 — You die.",
			"Turn 5 — You return with the cure. Adventure complete!",
		]);
		expect(within(entries[1]).getByText(/You reach level 2/)).toHaveClass(
			"font-semibold",
			"bg-primary/10",
		);
		expect(within(entries[2]).getByText(/Dexterity increases/)).toHaveClass(
			"font-medium",
		);
		expect(within(entries[4]).getByText(/You die/)).toHaveClass(
			"text-destructive",
		);
		expect(within(entries[5]).getByText(/Adventure complete/)).toHaveClass(
			"font-semibold",
		);
		for (const index of [1, 2, 4, 5])
			expect(entries[index].querySelector("svg")).toHaveAttribute(
				"aria-hidden",
				"true",
			);
		for (const index of [0, 3])
			expect(entries[index].querySelector("svg")).toBeNull();
		expect(screen.getByRole("log")).toHaveAttribute("aria-live", "polite");
	});
});
