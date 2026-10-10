import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { Coordinate, Dungeon } from "../../domain/dungeon/DungeonTypes.ts";
import { getDungeonCoordinateValue } from "../../domain/dungeon/Terrain.ts";
import { WALL } from "../../domain/dungeon/Tiles.ts";
import DungeonRow from "./DungeonRow.tsx";
import { getScrollOffset } from "./MapScroll.ts";

type DungeonLayoutProps = {
	dungeon: Dungeon;
	playerPosition: Coordinate;
	downStair?: Coordinate;
	upStair?: Coordinate;
	onPlayerMove: (coordinate: Coordinate) => void;
	movementEnabled?: boolean;
};

const DungeonLayout = ({
	dungeon,
	playerPosition,
	downStair,
	upStair,
	onPlayerMove,
	movementEnabled = true,
}: DungeonLayoutProps) => {
	const viewportRef = useRef<HTMLElement>(null);
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
	}, []);

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
	}, [followPlayer]);

	const movePlayer = useCallback(
		(changeUpDown: number, changeLeftRight: number) => {
			const newRow = playerPosition.row + changeUpDown;
			const newCol = playerPosition.col + changeLeftRight;

			const isOutOfBounds =
				newRow < 0 ||
				newRow >= dungeon.length ||
				newCol < 0 ||
				newCol >= (dungeon[newRow]?.length ?? 0);

			if (isOutOfBounds) {
				return;
			}

			const coordinateValueInPositionToMoveTo = getDungeonCoordinateValue(
				newCol,
				newRow,
				dungeon,
			);

			if (coordinateValueInPositionToMoveTo === WALL) {
				return;
			}

			const nextCoordinate = {
				row: newRow,
				col: newCol,
			};

			onPlayerMove(nextCoordinate);
		},
		[dungeon, onPlayerMove, playerPosition],
	);

	useEffect(() => {
		if (!movementEnabled) return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (
				event.target instanceof HTMLInputElement ||
				event.target instanceof HTMLTextAreaElement ||
				(event.target instanceof HTMLElement && event.target.isContentEditable)
			) {
				return;
			}

			switch (event.key) {
				case "ArrowUp":
				case "w":
					event.preventDefault();
					movePlayer(-1, 0);
					break;

				case "ArrowDown":
				case "s":
					event.preventDefault();
					movePlayer(1, 0);
					break;

				case "ArrowLeft":
				case "a":
					event.preventDefault();
					movePlayer(0, -1);
					break;

				case "ArrowRight":
				case "d":
					event.preventDefault();
					movePlayer(0, 1);
					break;
			}
		};

		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [movePlayer, movementEnabled]);

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
