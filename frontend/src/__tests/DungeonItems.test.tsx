import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";
import type { FloorItem } from "../domain/items/FloorItems";
import { createCorridorEncounter } from "./MonsterEncounterTestHelpers";

const run = createCorridorEncounter();
const item: FloorItem = {
	item: { id: "loot:1", kind: "iron-sword" },
	floorNumber: 1,
	coordinate: { row: 1, col: 2 },
};
const props = {
	dungeon: run.floors[0].terrain,
	playerPosition: run.playerCoordinate,
	onMoveRequested: () => {},
	floorItems: [item],
};
describe("Floor item symbols", () => {
	it("shows visible items and describes multiple items on the same tile", () => {
		render(
			<DungeonLayout
				{...props}
				floorItems={[
					item,
					{ ...item, item: { id: "loot:2", kind: "wooden-shield" } },
				]}
			/>,
		);
		expect(
			screen.getByLabelText("row1col2 - Iron sword and 1 more item"),
		).toBeVisible();
	});
	it("hides items on remembered and undiscovered tiles", () => {
		const visible = props.dungeon.map((row) => row.map(() => false));
		const explored = props.dungeon.map((row) => row.map(() => false));
		explored[1][2] = true;
		const { rerender } = render(
			<DungeonLayout {...props} visible={visible} explored={explored} />,
		);
		expect(screen.getByLabelText("row1col2 - remembered floor")).toBeVisible();
		explored[1][2] = false;
		rerender(
			<DungeonLayout
				{...props}
				visible={visible}
				explored={explored.map((row) => [...row])}
			/>,
		);
		expect(screen.getByLabelText("row1col2 - undiscovered")).toBeVisible();
	});
	it("keeps player, stair, and monster symbols recognizable over items", () => {
		const { rerender } = render(
			<DungeonLayout {...props} playerPosition={{ row: 1, col: 2 }} />,
		);
		expect(screen.getByLabelText("row1col2 - player")).toBeVisible();
		rerender(<DungeonLayout {...props} downStair={{ row: 1, col: 2 }} />);
		expect(screen.getByLabelText("row1col2 - stairs down")).toBeVisible();
		rerender(
			<DungeonLayout
				{...props}
				monsters={[
					{
						id: "1:1",
						kind: "goblin",
						floorNumber: 1,
						coordinate: item.coordinate,
						health: 4,
					},
				]}
			/>,
		);
		expect(screen.getByLabelText("row1col2 - goblin")).toBeVisible();
	});
});
