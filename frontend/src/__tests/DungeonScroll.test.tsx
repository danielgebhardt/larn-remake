import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DungeonLayout from "../components/dungeon/DungeonLayout.tsx";
import { FLOOR, WALL } from "../domain/dungeon/Tiles.ts";

describe("dungeon viewport following", () => {
	let width: number;
	let height: number;
	let resized: () => void;
	const disconnect = vi.fn();
	const terrain = Array.from({ length: 20 }, () => Array(30).fill(FLOOR));
	const noop = () => {};
	beforeEach(() => {
		width = 120;
		height = 96;
		disconnect.mockClear();
		vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(
			() => width,
		);
		vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockImplementation(
			() => height,
		);
		vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(720);
		vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(480);
		vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(
			function (this: HTMLElement) {
				const name = this.getAttribute("aria-label") ?? "";
				const coordinate = /^row(\d+)col(\d+)/.exec(name);
				const viewport = screen.queryByRole("region", { name: "Dungeon map" });
				const left = coordinate
					? 10 + Number(coordinate[2]) * 24 - (viewport?.scrollLeft ?? 0)
					: 10;
				const top = coordinate
					? 20 + Number(coordinate[1]) * 24 - (viewport?.scrollTop ?? 0)
					: 20;
				return {
					left,
					top,
					right: left + 24,
					bottom: top + 24,
					width: 24,
					height: 24,
				} as DOMRect;
			},
		);
		vi.stubGlobal(
			"ResizeObserver",
			class {
				constructor(callback: () => void) {
					resized = callback;
				}
				observe() {}
				disconnect = disconnect;
			},
		);
	});
	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});
	it("shows an off-screen initial player on both axes without moving focus or the outer page", () => {
		const onMove = vi.fn();
		render(
			<DungeonLayout
				dungeon={terrain}
				playerPosition={{ row: 10, col: 15 }}
				onPlayerMove={onMove}
			/>,
		);
		const viewport = screen.getByRole("region", { name: "Dungeon map" });
		expect(viewport.scrollLeft).toBe(288);
		expect(viewport.scrollTop).toBe(192);
		expect(document.activeElement).toBe(document.body);
		expect(window.scrollX).toBe(0);
		expect(window.scrollY).toBe(0);
		expect(onMove).not.toHaveBeenCalled();
	});
	it("preserves manual scrolling through rerenders and settings changes, then follows accepted movement", () => {
		const props = {
			dungeon: terrain,
			playerPosition: { row: 1, col: 1 },
			onPlayerMove: noop,
		};
		const { rerender } = render(<DungeonLayout {...props} />);
		const viewport = screen.getByRole("region", { name: "Dungeon map" });
		viewport.scrollLeft = 300;
		viewport.scrollTop = 200;
		rerender(
			<DungeonLayout
				{...props}
				playerPosition={{ row: 1, col: 1 }}
				onPlayerMove={() => {}}
				movementEnabled={false}
			/>,
		);
		rerender(<DungeonLayout {...props} />);
		expect(viewport.scrollLeft).toBe(300);
		expect(viewport.scrollTop).toBe(200);
		rerender(<DungeonLayout {...props} playerPosition={{ row: 1, col: 2 }} />);
		expect(viewport.scrollLeft).toBe(24);
		expect(viewport.scrollTop).toBe(0);
	});
	it("does not recenter for blocked or unaccepted movement", () => {
		const onMove = vi.fn();
		render(
			<DungeonLayout
				dungeon={[
					[WALL, WALL, WALL],
					[WALL, FLOOR, FLOOR],
					[WALL, WALL, WALL],
				]}
				playerPosition={{ row: 1, col: 1 }}
				onPlayerMove={onMove}
			/>,
		);
		const viewport = screen.getByRole("region", { name: "Dungeon map" });
		viewport.scrollLeft = 300;
		fireEvent.keyDown(window, { key: "ArrowLeft" });
		expect(onMove).not.toHaveBeenCalled();
		expect(viewport.scrollLeft).toBe(300);
		fireEvent.keyDown(window, { key: "ArrowRight" });
		expect(onMove).toHaveBeenCalledExactlyOnceWith({ row: 1, col: 2 });
		expect(viewport.scrollLeft).toBe(300);
	});
	it("follows replacement terrain even when a stair arrival or restart has the same coordinates", () => {
		const props = {
			dungeon: terrain,
			playerPosition: { row: 1, col: 1 },
			onPlayerMove: noop,
		};
		const { rerender } = render(<DungeonLayout {...props} />);
		const viewport = screen.getByRole("region", { name: "Dungeon map" });
		viewport.scrollLeft = 300;
		viewport.scrollTop = 200;
		rerender(
			<DungeonLayout {...props} dungeon={terrain.map((row) => [...row])} />,
		);
		expect(viewport.scrollLeft).toBe(0);
		expect(viewport.scrollTop).toBe(0);
	});
	it("brings the player back into view after the map container shrinks and cleans up observation", () => {
		width = 500;
		height = 400;
		const { unmount } = render(
			<DungeonLayout
				dungeon={terrain}
				playerPosition={{ row: 10, col: 15 }}
				onPlayerMove={noop}
			/>,
		);
		const viewport = screen.getByRole("region", { name: "Dungeon map" });
		expect(viewport.scrollLeft).toBe(0);
		width = 120;
		height = 96;
		act(() => resized());
		expect(viewport.scrollLeft).toBe(288);
		expect(viewport.scrollTop).toBe(192);
		unmount();
		expect(disconnect).toHaveBeenCalledOnce();
	});
});
