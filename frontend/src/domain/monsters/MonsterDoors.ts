import type { Coordinate } from "../dungeon/DungeonTypes";
import type { GameState } from "../game/GameState";
import { navigationRun } from "../objects/NavigationTerrain";
import { MONSTER_DEFINITIONS, type Monster } from "./Monster";
import { orthogonalDistance } from "./MonsterLocations";
import { selectPursuitStep } from "./MonsterPursuit";

export const doorPlanningRun = (state: Pick<GameState, "run" | "objects">) =>
	navigationRun({
		run: state.run,
		objects: state.objects.map((object) =>
			object.kind === "door" && !object.activated
				? { ...object, activated: true }
				: object,
		),
	});

// Consider an ordinary door only on the next shortest remembered route. This
// permits planning through ordinary doors without opening a sealed elite gate.
export const monsterDoorToOpen = (
	state: GameState,
	monster: Monster,
	actors: readonly Monster[],
) => {
	const memory = monster.awareness;
	if (
		!MONSTER_DEFINITIONS[monster.kind].opensDoors ||
		memory?.type !== "pursuing" ||
		memory.remaining <= 0
	)
		return undefined;
	const same = (a: Coordinate, b: Coordinate) => orthogonalDistance(a, b) === 0;
	const adjacent = state.objects.filter(
		(object) =>
			object.kind === "door" &&
			!object.activated &&
			object.floorNumber === monster.floorNumber &&
			orthogonalDistance(monster.coordinate, object.coordinate) === 1 &&
			!same(state.run.playerCoordinate, object.coordinate) &&
			!actors.some(
				(actor) =>
					actor.health > 0 &&
					actor.floorNumber === monster.floorNumber &&
					same(actor.coordinate, object.coordinate),
			),
	);
	if (!adjacent.length) return undefined;
	const planned = doorPlanningRun(state);
	const step = selectPursuitStep(
		planned,
		monster,
		actors,
		memory.target,
		!same(memory.target, state.run.playerCoordinate),
	);
	return step
		? adjacent.find((door) => same(door.coordinate, step))
		: undefined;
};
