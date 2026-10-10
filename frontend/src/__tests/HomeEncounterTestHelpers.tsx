import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import type { DungeonRun } from "../domain/dungeon/DungeonRun.ts";
import * as GameState from "../domain/game/GameState.ts";
import type { Monster } from "../domain/monsters/Monster.ts";
import * as MonsterPursuit from "../domain/monsters/MonsterPursuit";
import Home from "../Home.tsx";
import { ThemeProvider } from "../settings/ThemeProvider.tsx";
import { stubDungeonRun } from "./HomeTestHelpers.tsx";
import { createTestDungeonFloor } from "./testhelpers.ts";

export const renderEncounter = (initialHealth?: number) => {
	const run: DungeonRun = {
		seed: 123,
		activeFloor: 1,
		playerCoordinate: { row: 1, col: 1 },
		floors: [
			createTestDungeonFloor({
				floorNumber: 1,
				rows: 4,
				cols: 5,
				room: { startRow: 1, endRow: 2, startCol: 1, endCol: 3 },
				downStair: {
					coordinate: { row: 2, col: 3 },
					destinationFloor: 2,
					arrivalCoordinate: { row: 1, col: 1 },
				},
			}),
			createTestDungeonFloor({
				floorNumber: 2,
				rows: 3,
				cols: 4,
				room: { startRow: 1, endRow: 1, startCol: 1, endCol: 2 },
				upStair: {
					coordinate: { row: 1, col: 1 },
					destinationFloor: 1,
					arrivalCoordinate: { row: 2, col: 3 },
				},
			}),
		],
	};
	const goblin: Monster = {
		id: "1:1",
		kind: "goblin",
		floorNumber: 1,
		coordinate: { row: 1, col: 2 },
		health: 4,
	};
	const stubs = stubDungeonRun(run, [goblin]);
	// These fixtures isolate combat and recovery; HomePursuit exercises real AI.
	vi.spyOn(MonsterPursuit, "selectPursuitStep").mockReturnValue(undefined);
	if (initialHealth !== undefined) {
		const create = GameState.createGameState;
		vi.spyOn(GameState, "createGameState").mockImplementationOnce((run) => ({
			...create(run),
			player: { health: initialHealth, maxHealth: 10 },
		}));
	}
	render(<Home initialFogConfiguration={{ enabled: true, radius: 1 }} />, {
		wrapper: ThemeProvider,
	});
	return { user: userEvent.setup(), ...stubs };
};
