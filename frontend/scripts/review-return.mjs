// Controlled cleared-descent return. Fixed resources; not a human win-rate test.
import { createServer } from "vite";
import {
	createEscapeReview,
	escapePressurePlugin,
	recordEscapeReview,
} from "./review-escape.mjs";
import { parseReviewOptions, REVIEW_USAGE } from "./review-options.mjs";
import { createRoutes } from "./review-routing.mjs";

let options;
const server = await createServer({
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
	plugins: [escapePressurePlugin(() => options)],
});
try {
	const load = (path) => server.ssrLoadModule(path);
	const { DEFAULT_RUN_CONFIGURATION: defaults, CONFIGURATION_LIMITS: limits } =
		await load("/src/domain/dungeon/RunConfiguration.ts");
	options = parseReviewOptions(
		process.argv.slice(2),
		defaults,
		limits,
		0xffffffff,
	);
	if (options.help) {
		console.log(REVIEW_USAGE);
	} else {
		const { generateDungeonRun, connectDungeonFloors } = await load(
			"/src/domain/dungeon/DungeonRun.ts",
		);
		const { createGameState } = await load("/src/domain/game/GameState.ts");
		const { awardExperience } = await load(
			"/src/domain/game/ExperienceRewards.ts",
		);
		const { experienceThreshold } = await load(
			"/src/domain/game/Progression.ts",
		);
		const { reviewRoutingFloor } = await load("/scripts/review-terrain.mjs");
		const { maximumMana } = await load("/src/domain/game/Mana.ts");
		const { resolvePlayerAction } = await load(
			"/src/domain/game/PlayerActions.ts",
		);
		const { chooseTacticalAwareAction } = await load(
			"/scripts/review-tactics.mjs",
		);
		const { createBag } = await load("/src/domain/items/Bag.ts");
		const configuration = {
			...defaults,
			rows: options.rows,
			cols: options.cols,
			floorCount: options.floorCount,
		};
		for (const seed of options.seeds) {
			const initial = awardExperience(
				createGameState(
					connectDungeonFloors(
						generateDungeonRun(seed, options.floorCount, configuration),
					),
				),
				experienceThreshold(20),
			);
			const cure = initial.floorItems.find(
				(entry) => entry.item.kind === "cure",
			);
			if (!cure) throw new Error("Expected cure");
			const gear = (kind) => ({ id: `review:${kind}`, kind });
			let state = {
				...initial,
				turn: 1,
				run: {
					...initial.run,
					activeFloor: options.floorCount,
					playerCoordinate: cure.coordinate,
				},
				quest: { ...initial.quest, cureRecovered: true },
				escape: { startedTurn: 1, activatedFloors: [] },
				monsters: [],
				floorItems: [],
				objects: initial.objects.map((object) => ({
					...object,
					activated: true,
				})),
				equipment: {
					mainHand: gear("runeblade"),
					offHand: gear("tower-shield"),
					chest: gear("dragon-mail"),
					head: gear("runic-helmet"),
					leftRing: gear("ring-intelligence"),
					rightRing: null,
				},
				bag: createBag([
					...Array.from({ length: 3 }, (_, i) => ({
						id: `review:health:${i}`,
						kind: "greater-healing-potion",
					})),
					...Array.from({ length: 7 }, (_, i) => ({
						id: `review:mana:${i}`,
						kind: "greater-mana-potion",
					})),
				]),
			};
			state = {
				...state,
				player: { ...state.player, health: 33 },
				mana: maximumMana(state.progression, state.equipment, state.effects),
			};
			const review = createEscapeReview(),
				memory = {};
			let reason = "action limit";
			for (let index = 0; index < options.maxActions; index++) {
				if (state.quest.victory) {
					reason = "won";
					break;
				}
				if (state.player.health <= 0) {
					reason = "died";
					break;
				}
				const action = chooseTacticalAwareAction(
					state,
					createRoutes(reviewRoutingFloor(state), state.run.playerCoordinate),
					memory,
				);
				if (!action) {
					reason = "no route";
					break;
				}
				const resolution = resolvePlayerAction(state, action);
				if (!resolution.turnAdvanced)
					throw new Error(
						`Rejected action ${JSON.stringify(action)}: ${resolution.error ?? ""}`,
					);
				recordEscapeReview(review, state, action, resolution.state);
				state = resolution.state;
			}
			if (state.quest.victory) reason = "won";
			if (state.player.health <= 0) reason = "died";
			console.log(
				JSON.stringify({
					scenario: "controlled cleared-descent return",
					seed,
					configuration,
					escapePressure: !options.disableEscapePressure,
					reason,
					floor: state.run.activeFloor,
					turns: state.turn - 1,
					health: state.player.health,
					mana: state.mana,
					experience: state.progression.experience,
					gold: state.gold,
					...review,
				}),
			);
		}
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
} finally {
	await server.close();
}
