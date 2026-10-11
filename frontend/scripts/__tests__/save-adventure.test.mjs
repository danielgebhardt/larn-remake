// @vitest-environment node
import { describe, expect, it } from "vitest";
import {
	connectDungeonFloors,
	generateDungeonRun,
} from "../../src/domain/dungeon/DungeonRun";
import { updateExploration } from "../../src/domain/dungeon/Exploration";
import { DEFAULT_RUN_CONFIGURATION } from "../../src/domain/dungeon/RunConfiguration";
import { createGameState } from "../../src/domain/game/GameState";
import { resolvePlayerAction } from "../../src/domain/game/PlayerActions";
import {
	createSaveDocument,
	parseSave,
	restoreSave,
	serializeSave,
} from "../../src/domain/saves/SaveFormat";
import {
	readLocalSave,
	writeLocalSave,
} from "../../src/persistence/LocalAdventureSave";
import { chooseSpellAwareAction } from "../review-policy.mjs";
import { createRoutes } from "../review-routing.mjs";

const fog = { enabled: true, radius: 6 };
const start = (configuration = DEFAULT_RUN_CONFIGURATION) => {
	const state = createGameState(
		connectDungeonFloors(
			generateDungeonRun(0, configuration.floorCount, configuration),
		),
	);
	return {
		state,
		exploration: updateExploration(state.run, fog.radius),
		configuration,
		fog,
	};
};
const resume = (adventure) => {
	const result = parseSave(
		serializeSave(
			createSaveDocument(
				adventure.state,
				adventure.exploration,
				adventure.configuration,
				adventure.fog,
			),
		),
	);
	if (!result.ok) throw new Error(result.error);
	return restoreSave(result.value);
};
const act = (adventure, action) => {
	const result = resolvePlayerAction(adventure.state, action);
	if (!result.turnAdvanced)
		throw new Error(result.error ?? "Expected a committed action");
	return {
		...adventure,
		state: result.state,
		exploration: updateExploration(
			result.state.run,
			fog.radius,
			adventure.exploration,
		),
	};
};
describe("Saving and resuming real adventures", () => {
	it("finishes identically after a mid-adventure save on floor 2, including victory and discovery", () => {
		let original = start();
		let loaded = null;
		for (
			let actionCount = 0;
			actionCount < 3000 &&
			!original.state.quest.victory &&
			original.state.player.health > 0;
			actionCount++
		) {
			const { run } = original.state;
			const action = chooseSpellAwareAction(
				original.state,
				createRoutes(run.floors[run.activeFloor - 1], run.playerCoordinate),
			);
			if (!action) throw new Error("Adventure must have a route");
			original = act(original, action);
			if (loaded) {
				loaded = act(loaded, action);
				expect(loaded.state).toEqual(original.state);
				expect(loaded.exploration.explored).toEqual(
					original.exploration.explored,
				);
			} else if (original.state.run.activeFloor === 2)
				loaded = resume(original);
		}
		expect(loaded).not.toBeNull();
		expect(original.state.quest.victory).not.toBeNull();
		const completed = resume(original);
		expect(completed.state).toEqual(original.state);
		expect(completed.exploration.explored.size).toBe(5);
		expect(resolvePlayerAction(completed.state, { type: "wait" }).state).toBe(
			completed.state,
		);
	});
	it("preserves actual fatal combat and the ended-run guard", () => {
		let adventure = start();
		for (
			let turns = 0;
			turns < 100 && adventure.state.player.health > 0;
			turns++
		)
			adventure = act(adventure, { type: "wait" });
		expect(adventure.state.player.health).toBe(0);
		const loaded = resume(adventure);
		expect(loaded.state).toEqual(adventure.state);
		expect(resolvePlayerAction(loaded.state, { type: "wait" }).state).toBe(
			loaded.state,
		);
	});
	it("fits a fully explored maximum-size adventure in a conservative 5 MiB single slot", () => {
		const adventure = start({
			...DEFAULT_RUN_CONFIGURATION,
			rows: 100,
			cols: 100,
			floorCount: 20,
		});
		adventure.exploration.explored = new Map(
			adventure.state.run.floors.map((floor) => [
				floor.floorNumber,
				floor.terrain.map((row) => row.map(() => true)),
			]),
		);
		const document = createSaveDocument(
			adventure.state,
			adventure.exploration,
			adventure.configuration,
			fog,
		);
		let slot = null;
		const storage = {
			getItem: () => slot,
			setItem: (_key, value) => {
				if (value.length * 2 > 5 * 1024 * 1024)
					throw new Error("Quota exceeded");
				slot = value;
			},
		};
		expect(writeLocalSave(document, () => storage).ok).toBe(true);
		const read = readLocalSave(() => storage);
		if (!read.ok || !read.value) throw new Error("Maximum-size save must load");
		const loaded = restoreSave(read.value);
		expect(loaded.state).toEqual(adventure.state);
		expect(loaded.exploration.explored).toEqual(adventure.exploration.explored);
	});
});
