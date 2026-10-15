// Controlled cleared-descent return. Fixed resources; not a human win-rate test.

import { execFileSync } from "node:child_process";
import { createServer } from "vite";
import {
	createEscapeReview,
	escapePressurePlugin,
	recordEscapeReview,
} from "./review-escape.mjs";
import { parseReviewOptions, REVIEW_USAGE } from "./review-options.mjs";
import { createRoutes } from "./review-routing.mjs";

let options;
const directAscent = process.argv.includes("--direct-ascent");
const legacyReturn = process.argv.includes("--legacy-return");
const server = await createServer({
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
	plugins: [
		{
			name: "legacy-return-comparison",
			enforce: "pre",
			transform(_code, id) {
				const source = id.match(
					/\/src\/domain\/monsters\/(EscapeEncounters|PursuitRules|MonsterPursuit|MonsterTurns)\.ts$/,
				);
				if (legacyReturn && source)
					return execFileSync(
						"git",
						["show", `33207d1:frontend/src/domain/monsters/${source[1]}.ts`],
						{ encoding: "utf8" },
					);
			},
		},
		escapePressurePlugin(() => options),
	],
});
try {
	const load = (path) => server.ssrLoadModule(path);
	const { DEFAULT_RUN_CONFIGURATION: defaults, CONFIGURATION_LIMITS: limits } =
		await load("/src/domain/dungeon/RunConfiguration.ts");
	options = parseReviewOptions(
		process.argv
			.slice(2)
			.filter(
				(argument) =>
					!["--direct-ascent", "--legacy-return"].includes(argument),
			),
		defaults,
		limits,
		0xffffffff,
	);
	if (options.help) {
		console.log(
			`${REVIEW_USAGE}\nReturn-only: --direct-ascent prioritizes stairs; --legacy-return compares rules from commit 33207d1 (requires that Git history).`,
		);
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
		const { createAttackRolls } = await load(
			"/src/domain/game/CombatRandomness.ts",
		);
		const { hasLineOfSight } = await load("/src/domain/dungeon/Visibility.ts");
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
			const encountered = new Set(),
				engaged = new Set();
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
				const routes = createRoutes(
					reviewRoutingFloor(state),
					state.run.playerCoordinate,
				);
				let action = chooseTacticalAwareAction(state, routes, memory);
				if (
					directAscent &&
					action?.type !== "consume" &&
					!(action?.type === "cast" && action.spell === "heal")
				) {
					const target =
						state.run.activeFloor === 1
							? state.quest.entrance
							: state.run.floors[state.run.activeFloor - 1].upStair?.coordinate;
					const direction = target && routes(target)?.[0];
					if (direction) action = { type: "move", direction };
				}
				if (!action) {
					reason = "no route";
					break;
				}
				for (const actor of state.monsters) {
					if (
						actor.floorNumber === state.run.activeFloor &&
						Math.hypot(
							actor.coordinate.row - state.run.playerCoordinate.row,
							actor.coordinate.col - state.run.playerCoordinate.col,
						) <= 8 &&
						hasLineOfSight(
							state.run.floors[state.run.activeFloor - 1].terrain,
							actor.coordinate,
							state.run.playerCoordinate,
						)
					)
						encountered.add(actor.id);
				}
				if (action.type === "cast" && action.targetId)
					engaged.add(action.targetId);
				const resolution = resolvePlayerAction(state, action, (context) => {
					engaged.add(
						context.targetId === "player"
							? context.attackerId.split(":").slice(0, 2).join(":")
							: context.targetId,
					);
					return createAttackRolls(context);
				});
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
					policy: directAscent ? "direct-ascent" : "tactical-clear",
					returnRules: legacyReturn ? "33207d1" : "current",
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
					encounteredEnemies: encountered.size,
					engagedEnemies: engaged.size,
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
