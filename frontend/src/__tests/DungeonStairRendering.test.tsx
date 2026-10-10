import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ComponentProps, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout.tsx";
import {
	type DungeonRun,
	moveDungeonRun,
} from "../domain/dungeon/DungeonRun.ts";
import { FLOOR } from "../domain/dungeon/Tiles.ts";

const openDungeon = [
	[FLOOR, FLOOR, FLOOR],
	[FLOOR, FLOOR, FLOOR],
	[FLOOR, FLOOR, FLOOR],
];

const noopMoveRequested = () => {};

const TestDungeonLayout = ({
	playerPosition: initialPosition,
	onMoveRequested,
	...props
}: ComponentProps<typeof DungeonLayout>) => {
	const [run, setRun] = useState<DungeonRun>(() => ({
		seed: 0,
		activeFloor: 1,
		playerCoordinate: initialPosition,
		floors: [
			{
				floorNumber: 1,
				terrain: props.dungeon,
				rooms: [],
				corridors: [],
				partitions: {
					region: {
						startRow: 0,
						endRow: props.dungeon.length - 1,
						startCol: 0,
						endCol: (props.dungeon[0]?.length ?? 0) - 1,
					},
				},
			},
		],
	}));

	return (
		<DungeonLayout
			{...props}
			playerPosition={run.playerCoordinate}
			onMoveRequested={(direction) => {
				setRun((current) => moveDungeonRun(current, direction));
				onMoveRequested(direction);
			}}
		/>
	);
};

describe("Dungeon stair rendering", () => {
	it("renders a down stair marker on the supplied stair coordinate", () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 0, col: 0 }}
				downStair={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - stairs down" }),
		).toBeVisible();
	});

	it("renders an up stair marker on the supplied stair coordinate", () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 0, col: 0 }}
				upStair={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - stairs up" }),
		).toBeVisible();
	});

	it("renders the player instead of a down stair when occupying the same coordinate", () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 1 }}
				downStair={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
	});

	it("allows the player to occupy a down stair and restores the marker after moving away", async () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 1 }}
				downStair={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();

		await userEvent.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", { name: "row1col1 - stairs down" }),
		).toBeVisible();

		await userEvent.keyboard("{ArrowLeft}");

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
	});

	it("renders the player instead of an up stair when occupying the same coordinate", () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 1 }}
				upStair={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
	});

	it("allows the player to occupy an up stair and restores the marker after moving away", async () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 1 }}
				upStair={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();

		await userEvent.keyboard("{ArrowRight}");

		expect(
			screen.getByRole("cell", { name: "row1col1 - stairs up" }),
		).toBeVisible();

		await userEvent.keyboard("{ArrowLeft}");

		expect(
			screen.getByRole("cell", { name: "row1col1 - player" }),
		).toBeVisible();
	});

	it("provides an accessible description for a down stair", () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 0, col: 0 }}
				downStair={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		const stairCell = screen.getByRole("cell", {
			name: "row1col1 - stairs down",
		});

		expect(stairCell).toBeVisible();
	});

	it("provides an accessible description for an up stair", () => {
		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 0, col: 0 }}
				upStair={{ row: 1, col: 1 }}
				onMoveRequested={noopMoveRequested}
			/>,
		);

		const stairCell = screen.getByRole("cell", {
			name: "row1col1 - stairs up",
		});

		expect(stairCell).toBeVisible();
	});

	it("reports movement onto an up stair through onMoveRequested", async () => {
		const onMoveRequested = vi.fn();

		render(
			<TestDungeonLayout
				dungeon={openDungeon}
				playerPosition={{ row: 1, col: 2 }}
				upStair={{ row: 1, col: 1 }}
				onMoveRequested={onMoveRequested}
			/>,
		);

		await userEvent.keyboard("{ArrowLeft}");

		expect(onMoveRequested).toHaveBeenCalledTimes(1);
		expect(onMoveRequested).toHaveBeenCalledWith("left");
	});
});
