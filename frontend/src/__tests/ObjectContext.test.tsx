import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import ObjectContext from "../components/objects/ObjectContext";
import { createGameState } from "../domain/game/GameState";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const state = () => ({
	...createGameState(createCorridorEncounter()),
	objects: [
		{
			id: "floor:1:object:chest:1",
			kind: "chest" as const,
			floorNumber: 1,
			coordinate: { row: 1, col: 2 },
			activated: true,
		},
	],
});
it("explains a loaded spent chest and its remaining loot without needing a new action", () => {
	render(<ObjectContext state={state()} />);
	expect(screen.getByLabelText("Nearby objects")).toHaveTextContent(
		"Already opened; any remaining reward is on the floor",
	);
	expect(screen.getByLabelText("Nearby objects")).toHaveTextContent("Press G");
});
it("does not reveal hidden or other-floor objects", () => {
	const current = state();
	render(
		<ObjectContext
			state={{
				...current,
				objects: [
					...current.objects,
					{
						...current.objects[0],
						id: "floor:2:object:chest:1",
						floorNumber: 2,
					},
				],
			}}
			visible={Array.from({ length: 3 }, () => Array(9).fill(false))}
		/>,
	);
	expect(screen.queryByLabelText("Nearby objects")).not.toBeInTheDocument();
});
