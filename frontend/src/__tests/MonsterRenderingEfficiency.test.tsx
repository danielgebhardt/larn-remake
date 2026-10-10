import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout";
import TileIcon from "../components/dungeon/TileIcon";
import MonsterIcon from "../components/monsters/MonsterIcon";
import { FLOOR } from "../domain/dungeon/Tiles";
import type { Monster } from "../domain/monsters/Monster";

// Count icon work without constructing 10,000 SVGs in this structural regression.
vi.mock("../components/dungeon/TileIcon", () => ({
	default: vi.fn(() => null),
}));
vi.mock("../components/monsters/MonsterIcon", () => ({
	default: vi.fn(() => null),
}));

describe("Monster rendering efficiency", () => {
	it("updates the changed actor cells rather than redrawing a 100 x 100 map", () => {
		const terrain = Array.from({ length: 100 }, () =>
			Array<string>(100).fill(FLOOR),
		);
		const monsters: Monster[] = [
			{
				id: "1:1",
				kind: "goblin",
				floorNumber: 1,
				coordinate: { row: 50, col: 50 },
				health: 4,
			},
			{
				id: "1:2",
				kind: "goblin",
				floorNumber: 1,
				coordinate: { row: 90, col: 90 },
				health: 4,
			},
		];
		const props = {
			dungeon: terrain,
			monsters,
			playerPosition: { row: 1, col: 1 },
			onMoveRequested: vi.fn(),
		};
		const { rerender } = render(<DungeonLayout {...props} />);
		vi.mocked(TileIcon).mockClear();
		vi.mocked(MonsterIcon).mockClear();
		rerender(
			<DungeonLayout
				{...props}
				monsters={[
					{ ...monsters[0], coordinate: { row: 51, col: 50 } },
					monsters[1],
				]}
			/>,
		);
		expect(screen.getByLabelText("row50col50 - floor")).toBeVisible();
		expect(screen.getByLabelText("row51col50 - goblin")).toBeVisible();
		expect(screen.getByLabelText("row90col90 - goblin")).toBeVisible();
		expect(vi.mocked(TileIcon).mock.calls.length).toBeLessThan(10);
		expect(vi.mocked(MonsterIcon).mock.calls.length).toBeLessThan(3);
		expect(vi.mocked(MonsterIcon).mock.calls.length).toBeGreaterThan(0);
	});
});
