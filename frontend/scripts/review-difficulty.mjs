// Matched generated-content and saved-continuation audit, not a win-rate simulation.
import assert from "node:assert/strict";
import { createServer } from "vite";

const server = await createServer({
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
});
try {
	const load = (path) => server.ssrLoadModule(path);
	const { parseSeedInput } = await load("/src/domain/dungeon/Seed.ts");
	const args = process.argv.slice(2);
	if (args.includes("--help")) {
		console.log(
			"Usage: node scripts/review-difficulty.mjs [seeds...]\nDefaults: 0 1 123 987; audits 20×20×5 and 60×60×20 under all three modes.",
		);
	} else {
		const seeds = (args.length ? args : ["0", "1", "123", "987"]).map(
			(input) => {
				const seed = parseSeedInput(input);
				if (seed === undefined) throw new Error(`Invalid seed: ${input}`);
				return seed;
			},
		);
		const {
			DEFAULT_RUN_CONFIGURATION: defaults,
			DEFAULT_FOG_CONFIGURATION: fog,
		} = await load("/src/domain/dungeon/RunConfiguration.ts");
		const { generateDungeonRun, connectDungeonFloors } = await load(
			"/src/domain/dungeon/DungeonRun.ts",
		);
		const { updateExploration } = await load(
			"/src/domain/dungeon/Exploration.ts",
		);
		const { createGameState } = await load("/src/domain/game/GameState.ts");
		const { damageMonster } = await load("/src/domain/game/MonsterDamage.ts");
		const { resolvePlayerAction } = await load(
			"/src/domain/game/PlayerActions.ts",
		);
		const { generateEscapeEncounters } = await load(
			"/src/domain/monsters/EscapeEncounters.ts",
		);
		const { MONSTER_DEFINITIONS: definitions } = await load(
			"/src/domain/monsters/Monster.ts",
		);
		const { monsterDamageRange } = await load(
			"/src/domain/monsters/MonsterStats.ts",
		);
		const { navigationRun } = await load(
			"/src/domain/objects/NavigationTerrain.ts",
		);
		const { createSaveDocument, serializeSave, parseSave, restoreSave } =
			await load("/src/domain/saves/SaveFormat.ts");
		// JSON omits absent optional stair fields; restore makes those explicitly undefined.
		const persistedValue = (value) => JSON.parse(JSON.stringify(value));
		const identities = (actors) =>
			actors.map(({ health: _health, ...identity }) => identity);
		const content = ({ monsters, difficulty: _difficulty, ...state }) => ({
			...state,
			monsters: identities(monsters),
		});
		const scaled = (value, mode) => Math.max(1, Math.round(value * mode));
		let comparisons = 0,
			continuations = 0,
			eliteActors = 0;
		for (const [rows, floors] of [
			[20, 5],
			[60, 20],
		]) {
			for (const seed of seeds) {
				const configuration = {
					...defaults,
					rows,
					cols: rows,
					floorCount: floors,
				};
				const run = connectDungeonFloors(
					generateDungeonRun(seed, floors, configuration),
				);
				const baseline = createGameState(run);
				const baselineContent = structuredClone(content(baseline));
				const normalReturn = generateEscapeEncounters(baseline, 1);
				const modes = [];
				eliteActors += baseline.monsters.filter((actor) =>
					actor.id.endsWith(":20001"),
				).length;
				for (const difficulty of [0.75, 1, 1.25]) {
					const state = createGameState(run, difficulty);
					assert.deepEqual(content(state), baselineContent);
					for (const actor of state.monsters) {
						assert.equal(
							actor.health,
							scaled(definitions[actor.kind].maxHealth, difficulty),
						);
						const normalRange = monsterDamageRange(actor.kind);
						assert.deepEqual(monsterDamageRange(actor.kind, difficulty), {
							minDamage: scaled(normalRange.minDamage, difficulty),
							maxDamage: scaled(normalRange.maxDamage, difficulty),
						});
					}
					const returning = generateEscapeEncounters(state, 1);
					assert.deepEqual(identities(returning), identities(normalReturn));
					for (const actor of returning)
						assert.equal(
							actor.health,
							scaled(definitions[actor.kind].maxHealth, difficulty),
						);
					// Exercise actual kills/rewards, a wounded survivor and the mana-recovery boundary.
					let played = { ...state, turn: 29, mana: 2 };
					const defeated = played.monsters[1];
					if (defeated)
						played = damageMonster(played, defeated, 999, {
							type: "player-hit",
						});
					const wounded = played.monsters[0];
					if (wounded && wounded.health > 1)
						played = damageMonster(played, wounded, 1, { type: "player-hit" });
					const exploration = updateExploration(
						navigationRun(played),
						fog.radius,
					);
					const document = createSaveDocument(
						played,
						exploration,
						{ ...configuration, difficulty },
						fog,
					);
					const parsed = parseSave(serializeSave(document));
					assert.equal(parsed.ok, true, parsed.error);
					const restored = restoreSave(parsed.value);
					assert.deepEqual(
						persistedValue(restored.state),
						persistedValue(played),
					);
					assert.equal(restored.configuration.difficulty, difficulty);
					assert.deepEqual(
						persistedValue(
							resolvePlayerAction(restored.state, { type: "wait" }),
						),
						persistedValue(resolvePlayerAction(played, { type: "wait" })),
					);
					comparisons++;
					continuations++;
					modes.push({
						difficulty,
						enemyHealth: state.monsters.reduce(
							(total, actor) => total + actor.health,
							0,
						),
						returnHealth: returning.reduce(
							(total, actor) => total + actor.health,
							0,
						),
					});
				}
				console.log(
					JSON.stringify({
						seed,
						rows,
						cols: rows,
						floors,
						monsters: baseline.monsters.length,
						eliteActors: baseline.monsters.filter((actor) =>
							actor.id.endsWith(":20001"),
						).length,
						floorItems: baseline.floorItems.length,
						objects: baseline.objects.length,
						modes,
					}),
				);
			}
		}
		console.log(
			JSON.stringify({
				type: "summary",
				matchedRuns: comparisons,
				savedContinuations: continuations,
				distinctEliteActors: eliteActors,
				contentStable: true,
				scope:
					"Generated content, scaled actor health/physical ranges, return actors and one played save/turn continuation. No human win-rate or full-run balance claim.",
			}),
		);
	}
} finally {
	await server.close();
}
