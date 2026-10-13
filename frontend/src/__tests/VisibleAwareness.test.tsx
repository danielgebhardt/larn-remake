import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ObservedCreatures from "../components/monsters/ObservedCreatures";
import type { Monster } from "../domain/monsters/Monster";
import { visibleAwarenessEvents } from "../domain/monsters/VisibleAwareness";

const actor: Monster = {
	id: "1:1",
	kind: "goblin",
	floorNumber: 1,
	coordinate: { row: 1, col: 1 },
	health: 4,
	intent: { type: "idle" },
	awareness: { type: "searching", target: { row: 1, col: 2 }, remaining: 2 },
};
describe("Visible awareness", () => {
	it("describes searching actors without exposing hidden ones", () => {
		render(
			<ObservedCreatures
				monsters={[
					actor,
					{ ...actor, id: "1:2", kind: "orc", coordinate: { row: 2, col: 2 } },
				]}
				visible={[
					[false, false, false],
					[false, true, false],
					[false, false, false],
				]}
			/>,
		);
		expect(screen.getByText("Searching: 1")).toBeVisible();
		expect(screen.queryByText("orc")).not.toBeInTheDocument();
	});
	it("reports only visible state transitions rather than every pursuit step", () => {
		const pursuing = {
			...actor,
			awareness: {
				type: "pursuing" as const,
				target: { row: 1, col: 2 },
				remaining: 12,
				blocked: 0,
			},
		};
		expect(
			visibleAwarenessEvents([pursuing], [actor], 1, 3, undefined),
		).toEqual([
			{
				type: "monster-awareness-changed",
				monster: "goblin",
				awareness: "searching",
				turn: 3,
			},
		]);
		expect(
			visibleAwarenessEvents(
				[pursuing],
				[{ ...pursuing, coordinate: { row: 1, col: 2 } }],
				1,
				3,
				undefined,
			),
		).toEqual([]);
		expect(
			visibleAwarenessEvents([pursuing], [actor], 1, 3, [
				[false, false],
				[false, false],
			]),
		).toEqual([]);
		expect(
			visibleAwarenessEvents([pursuing], [actor], 2, 3, undefined),
		).toEqual([]);
	});
});
