import type { DungeonRun } from "../dungeon/DungeonRun";
import { FLOOR } from "../dungeon/Tiles";
import type { Monster } from "./Monster";
import {
	orthogonalDistance,
	protectedFloorLocations,
} from "./MonsterLocations";

// Cardinal tie order matches pursuit. Fear cannot cross stairs, allies or the player.
export const selectRetreatStep = (
	run: DungeonRun,
	monster: Monster,
	actors: readonly Monster[],
) => {
	const blocked = [
		run.playerCoordinate,
		...protectedFloorLocations(run, monster.floorNumber),
		...actors
			.filter(
				(actor) =>
					actor.id !== monster.id &&
					actor.health > 0 &&
					actor.floorNumber === monster.floorNumber,
			)
			.map((actor) => actor.coordinate),
	];
	const terrain = run.floors[monster.floorNumber - 1].terrain;
	const distance = orthogonalDistance(monster.coordinate, run.playerCoordinate);
	return [
		{ row: -1, col: 0 },
		{ row: 0, col: 1 },
		{ row: 1, col: 0 },
		{ row: 0, col: -1 },
	]
		.map((offset) => ({
			row: monster.coordinate.row + offset.row,
			col: monster.coordinate.col + offset.col,
		}))
		.find(
			(point) =>
				terrain[point.row]?.[point.col] === FLOOR &&
				orthogonalDistance(point, run.playerCoordinate) > distance &&
				!blocked.some(
					(other) => other.row === point.row && other.col === point.col,
				),
		);
};
