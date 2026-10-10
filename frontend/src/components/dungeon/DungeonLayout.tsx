import {
	type RefObject,
	useCallback,
	useEffect,
	useLayoutEffect,
	useMemo,
	useRef,
} from "react";
import type { MovementDirection } from "../../domain/dungeon/DungeonRun.ts";
import type { Coordinate, Dungeon } from "../../domain/dungeon/DungeonTypes.ts";
import type { VisibilityGrid } from "../../domain/dungeon/Visibility.ts";
import type { FloorItem } from "../../domain/items/FloorItems";
import type { Monster } from "../../domain/monsters/Monster.ts";
import DungeonRow from "./DungeonRow.tsx";
import { getScrollOffset } from "./MapScroll.ts";

type DungeonLayoutProps = {
	dungeon: Dungeon;
	playerPosition: Coordinate;
	downStair?: Coordinate;
	upStair?: Coordinate;
	onMoveRequested: (direction: MovementDirection) => void;
	onWaitRequested?: () => void;
	onPickupRequested?: () => void;
	onCharacterRequested?: () => void;
	mapRef?: RefObject<HTMLElement | null>;
	movementEnabled?: boolean;
	visible?: VisibilityGrid;
	explored?: VisibilityGrid;
	monsters?: readonly Monster[];
	floorItems?: readonly FloorItem[];
};

const NO_MONSTERS: readonly Monster[] = [];
const NO_ITEMS: readonly FloorItem[] = [];
const FOCUSED_CONTROLS =
	'button, a[href], select, input, [role="button"], [role="checkbox"], [role="switch"], [role="combobox"], [role="slider"]';

const DungeonLayout = ({
	dungeon,
	playerPosition,
	downStair,
	upStair,
	onMoveRequested,
	onWaitRequested,
	onPickupRequested,
	onCharacterRequested,
	mapRef,
	movementEnabled = true,
	visible,
	explored,
	monsters = NO_MONSTERS,
	floorItems = NO_ITEMS,
}: DungeonLayoutProps) => {
	const itemRows = useMemo(() => {
		const rows = new Map<number, FloorItem[]>();
		for (const item of floorItems) {
			const row = rows.get(item.coordinate.row) ?? [];
			row.push(item);
			rows.set(item.coordinate.row, row);
		}
		return rows;
	}, [floorItems]);
	const monsterRows = useMemo(() => {
		const rows = new Map<number, Monster[]>();
		for (const monster of monsters) {
			if (monster.health <= 0) continue;
			const row = rows.get(monster.coordinate.row) ?? [];
			row.push(monster);
			rows.set(monster.coordinate.row, row);
		}
		return rows;
	}, [monsters]);
	const localViewportRef = useRef<HTMLElement>(null);
	const viewportRef = mapRef ?? localViewportRef;
	const playerRef = useRef<HTMLTableCellElement>(null);
	const followPlayer = useCallback(() => {
		const viewport = viewportRef.current;
		const player = playerRef.current;
		if (
			!viewport ||
			!player ||
			viewport.clientWidth === 0 ||
			viewport.clientHeight === 0
		)
			return;
		const view = viewport.getBoundingClientRect();
		const tile = player.getBoundingClientRect();
		const left = getScrollOffset({
			offset: viewport.scrollLeft,
			viewportSize: viewport.clientWidth,
			contentSize: viewport.scrollWidth,
			tileStart:
				tile.left - view.left - viewport.clientLeft + viewport.scrollLeft,
			tileSize: tile.width,
			margin: tile.width,
		});
		const top = getScrollOffset({
			offset: viewport.scrollTop,
			viewportSize: viewport.clientHeight,
			contentSize: viewport.scrollHeight,
			tileStart: tile.top - view.top - viewport.clientTop + viewport.scrollTop,
			tileSize: tile.height,
			margin: tile.height,
		});
		if (left !== viewport.scrollLeft) viewport.scrollLeft = left;
		if (top !== viewport.scrollTop) viewport.scrollTop = top;
	}, [viewportRef]);

	useLayoutEffect(() => {
		if (dungeon[playerPosition.row]?.[playerPosition.col] !== undefined)
			followPlayer();
	}, [dungeon, playerPosition.row, playerPosition.col, followPlayer]);

	useEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		if (typeof ResizeObserver === "undefined") {
			window.addEventListener("resize", followPlayer);
			return () => window.removeEventListener("resize", followPlayer);
		}
		const observer = new ResizeObserver(followPlayer);
		observer.observe(viewport);
		return () => observer.disconnect();
	}, [followPlayer, viewportRef]);

	useEffect(() => {
		if (!movementEnabled && !onCharacterRequested) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target instanceof HTMLElement &&
					(event.target.isContentEditable ||
						event.target.closest('[role="log"]')))
			) {
				return;
			}

			if (event.key === "i" || event.key === "I") {
				if (
					!onCharacterRequested ||
					event.ctrlKey ||
					event.metaKey ||
					event.altKey ||
					(event.target instanceof HTMLElement &&
						event.target.closest(FOCUSED_CONTROLS))
				)
					return;
				event.preventDefault();
				if (!event.repeat) onCharacterRequested();
				return;
			}
			if (!movementEnabled) return;

			switch (event.key) {
				case "g":
				case "G":
					if (
						!onPickupRequested ||
						event.ctrlKey ||
						event.metaKey ||
						event.altKey ||
						(event.target instanceof HTMLElement &&
							event.target.closest(FOCUSED_CONTROLS))
					)
						return;
					event.preventDefault();
					if (!event.repeat) onPickupRequested();
					break;
				case " ":
					// Space belongs to focused controls and log scrolling first.
					if (
						!onWaitRequested ||
						(event.target instanceof HTMLElement &&
							event.target.closest(FOCUSED_CONTROLS))
					)
						return;
					event.preventDefault();
					if (!event.repeat) onWaitRequested();
					break;
				case "ArrowUp":
				case "w":
					event.preventDefault();
					onMoveRequested("up");
					break;

				case "ArrowDown":
				case "s":
					event.preventDefault();
					onMoveRequested("down");
					break;

				case "ArrowLeft":
				case "a":
					event.preventDefault();
					onMoveRequested("left");
					break;

				case "ArrowRight":
				case "d":
					event.preventDefault();
					onMoveRequested("right");
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [
		onMoveRequested,
		onWaitRequested,
		onPickupRequested,
		onCharacterRequested,
		movementEnabled,
	]);

	return (
		<section
			ref={viewportRef}
			aria-label="Dungeon map"
			// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to focus the scrollable map region.
			tabIndex={0}
			className="min-h-0 w-full flex-1 overflow-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
		>
			<table aria-label="Dungeon" className="mx-auto w-max border-collapse">
				<tbody className="grid">
					{dungeon.map((row, rowIndex) => (
						<DungeonRow
							key={rowIndex}
							row={row}
							rowIndex={rowIndex}
							monsters={monsterRows.get(rowIndex)}
							floorItems={itemRows.get(rowIndex)}
							visible={visible?.[rowIndex]}
							explored={explored?.[rowIndex]}
							playerColumn={
								playerPosition.row === rowIndex ? playerPosition.col : undefined
							}
							upStairColumn={
								upStair?.row === rowIndex ? upStair.col : undefined
							}
							downStairColumn={
								downStair?.row === rowIndex ? downStair.col : undefined
							}
							playerRef={playerRef}
						/>
					))}
				</tbody>
			</table>
		</section>
	);
};

export default DungeonLayout;
