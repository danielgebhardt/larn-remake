import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../domain/dungeon/DungeonRun";
import { updateExploration } from "../domain/dungeon/Exploration";
import {
	DEFAULT_FOG_CONFIGURATION,
	DEFAULT_RUN_CONFIGURATION,
} from "../domain/dungeon/RunConfiguration";
import { createGameState } from "../domain/game/GameState";
import { resolvePlayerAction } from "../domain/game/PlayerActions";
import { createSaveDocument } from "../domain/saves/SaveFormat";

export const savedAdventure = () => {
	const run = connectDungeonFloors(
		generateDungeonRun(
			123,
			DEFAULT_RUN_CONFIGURATION.floorCount,
			DEFAULT_RUN_CONFIGURATION,
		),
	);
	let state = createGameState(run);
	let exploration = updateExploration(run, DEFAULT_FOG_CONFIGURATION.radius);
	for (let i = 0; i < 3; i++) {
		state = resolvePlayerAction(state, { type: "wait" }).state;
		exploration = updateExploration(
			state.run,
			DEFAULT_FOG_CONFIGURATION.radius,
			exploration,
		);
	}
	return createSaveDocument(
		state,
		exploration,
		DEFAULT_RUN_CONFIGURATION,
		DEFAULT_FOG_CONFIGURATION,
		new Date("2026-10-11T12:00:00.000Z"),
	);
};
