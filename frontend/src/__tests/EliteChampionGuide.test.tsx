import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import ObservedCreatures from "../components/monsters/ObservedCreatures";

it.each([
	[8, 0.75, 54, 13, 14],
	[8, 1, 72, 17, 19],
	[8, 1.25, 90, 21, 24],
	[20, 0.75, 108, 22, 23],
	[20, 1, 144, 29, 31],
	[20, 1.25, 180, 36, 39],
] as const)(
	"shows the observed floor-%i champion at difficulty %s",
	(floorNumber, difficulty, health, min, max) => {
		render(
			<ObservedCreatures
				difficulty={difficulty}
				monsters={[
					{
						id: `${floorNumber}:20001`,
						kind: "iron-champion",
						floorNumber,
						coordinate: { row: 1, col: 1 },
						health: 23,
						intent: { type: "idle" },
					},
				]}
			/>,
		);
		expect(
			screen.getByText(
				new RegExp(`Maximum health ${health}.*melee damage ${min}–${max}`),
			),
		).toBeVisible();
		expect(
			screen.getByText(/health and melee\/charge damage grow with floor depth/),
		).toBeVisible();
	},
);
