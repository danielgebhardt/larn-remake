// A reproducible, omniscient cure-and-return walker, not a player AI or a win-rate test.
// Run from frontend: node scripts/review-adventure.mjs
import { createServer } from "vite";
import {
	parseReviewOptions,
	REVIEW_USAGE,
	summarizeReviews,
} from "./review-options.mjs";
import { createRoutes } from "./review-routing.mjs";

const sumCounts = (records) =>
	records.reduce((sum, record) => {
		for (const [key, value] of Object.entries(record))
			sum[key] = (sum[key] ?? 0) + value;
		return sum;
	}, {});
let options;
const server = await createServer({
	plugins: [
		{
			name: "diagnostic-mana-interval",
			transform(code, id) {
				if (
					!options?.manaRecoveryInterval ||
					!id.endsWith("/src/domain/game/Mana.ts")
				)
					return;
				const pattern = /export const MANA_RECOVERY_INTERVAL = \d+;/;
				if (!pattern.test(code))
					throw new Error(
						"Cannot apply diagnostic mana interval: rule declaration changed.",
					);
				return code.replace(
					pattern,
					`export const MANA_RECOVERY_INTERVAL = ${options.manaRecoveryInterval};`,
				);
			},
		},
	],
	configFile: false,
	server: { middlewareMode: true, hmr: false, ws: false },
	optimizeDeps: { noDiscovery: true, entries: [] },
	appType: "custom",
});
try {
	const { generateDungeonRun, connectDungeonFloors } =
		await server.ssrLoadModule("/src/domain/dungeon/DungeonRun.ts");
	const { DEFAULT_RUN_CONFIGURATION, CONFIGURATION_LIMITS } =
		await server.ssrLoadModule("/src/domain/dungeon/RunConfiguration.ts");
	const { MAX_SEED } = await server.ssrLoadModule(
		"/src/domain/dungeon/Seed.ts",
	);
	options = parseReviewOptions(
		process.argv.slice(2),
		DEFAULT_RUN_CONFIGURATION,
		CONFIGURATION_LIMITS,
		MAX_SEED,
	);
	const { createGameState } = await server.ssrLoadModule(
		"/src/domain/game/GameState.ts",
	);
	const { resolvePlayerAction } = await server.ssrLoadModule(
		"/src/domain/game/PlayerActions.ts",
	);
	const { equipmentSlotFor } = await server.ssrLoadModule(
		"/src/domain/items/Equipment.ts",
	);
	const { ITEM_DEFINITIONS } = await server.ssrLoadModule(
		"/src/domain/items/Item.ts",
	);
	const { levelForExperience } = await server.ssrLoadModule(
		"/src/domain/game/Progression.ts",
	);
	const { deriveAttributes } = await server.ssrLoadModule(
		"/src/domain/game/Attributes.ts",
	);
	const { chooseSpellAwareAction } = await server.ssrLoadModule(
		"/scripts/review-policy.mjs",
	);
	const {
		createReviewMetrics,
		observeReviewEquipment,
		recordReviewTurn,
		summarizeReviewMetrics,
	} = await server.ssrLoadModule("/scripts/review-metrics.mjs");
	const { chooseTacticalAwareAction } = await server.ssrLoadModule(
		"/scripts/review-tactics.mjs",
	);
	const { maximumMana, MANA_RECOVERY_INTERVAL } = await server.ssrLoadModule(
		"/src/domain/game/Mana.ts",
	);
	if (options.help) {
		console.log(REVIEW_USAGE);
	} else {
		const configuration = {
			...DEFAULT_RUN_CONFIGURATION,
			rows: options.rows,
			cols: options.cols,
			floorCount: options.floorCount,
		};
		const results = [];
		const same = (a, b) => a.row === b.row && a.col === b.col;
		for (const seed of options.seeds) {
			let state = createGameState(
				connectDungeonFloors(
					generateDungeonRun(seed, options.floorCount, configuration),
				),
			);
			const initial = {
				monsters: state.monsters.map((monster) => ({
					floor: monster.floorNumber,
					kind: monster.kind,
				})),
				loot: state.floorItems.map((entry) => ({
					floor: entry.floorNumber,
					kind: entry.item.kind,
				})),
			};
			let kills = 0;
			const metrics = createReviewMetrics();
			const observedEquipment = new Set();
			const tacticalMemory = {};
			let potions = 0;
			const potionUses = {};
			const casts = {};
			const visited = new Set([1]);
			const checkpoints = [];
			const actions = [];
			let reason = "action limit";
			for (let iteration = 0; iteration < options.maxActions; iteration++) {
				if (state.quest.victory) {
					reason = "won";
					break;
				}
				if (state.player.health <= 0) {
					reason = "died";
					break;
				}
				const floor = state.run.floors[state.run.activeFloor - 1];
				const position = state.run.playerCoordinate;
				let routes;
				const route = (target) => {
					if (!routes) routes = createRoutes(floor, position);
					return routes(target);
				};
				const active = state.monsters.filter(
					(monster) =>
						monster.floorNumber === floor.floorNumber && monster.health > 0,
				);
				const ground = state.floorItems.filter(
					(entry) => entry.floorNumber === floor.floorNumber,
				);
				let action;
				const healing = state.bag.items.find(
					(item) => item.kind === "healing-potion",
				);
				const upgrade = state.bag.items.find((item) => {
					const slot = equipmentSlotFor(item);
					if (!slot) return false;
					const current = state.equipment[slot];
					const value = (definition) =>
						definition.attackBonus + definition.armor;
					return (
						!current ||
						value(ITEM_DEFINITIONS[item.kind]) >
							value(ITEM_DEFINITIONS[current.kind])
					);
				});
				if (options.policy !== "baseline") {
					action =
						options.policy === "tactical-aware"
							? chooseTacticalAwareAction(state, route, tacticalMemory)
							: chooseSpellAwareAction(state, route);
					if (!action) {
						reason = "no route";
						break;
					}
				} else if (healing && state.player.health <= 6) {
					action = { type: "consume", itemId: healing.id };
				} else if (state.quest.cureRecovered) {
					const destination =
						floor.floorNumber === 1
							? state.quest.entrance
							: floor.upStair?.coordinate;
					const path = destination ? route(destination) : null;
					if (!path?.length) {
						reason = "no route";
						break;
					}
					action = { type: "move", direction: path[0] };
				} else if (upgrade)
					action = {
						type: "equip",
						itemId: upgrade.id,
						slot: equipmentSlotFor(upgrade),
					};
				else {
					const adjacent = active.find(
						(monster) =>
							Math.abs(monster.coordinate.row - position.row) +
								Math.abs(monster.coordinate.col - position.col) ===
							1,
					);
					const here = ground.find((entry) => same(entry.coordinate, position));
					if (adjacent)
						action = {
							type: "move",
							direction: route(adjacent.coordinate)?.[0],
						};
					else if (
						here &&
						(here.item.kind === "cure" || state.bag.items.length < 20)
					)
						action = { type: "pickup", itemId: here.item.id };
					else {
						const targets = [
							...active.map((monster) => monster.coordinate),
							...(state.bag.items.length < 20
								? ground.map((entry) => entry.coordinate)
								: ground
										.filter((entry) => entry.item.kind === "cure")
										.map((entry) => entry.coordinate)),
						];
						const paths = targets
							.map((target) => route(target))
							.filter((path) => path?.length)
							.sort((a, b) => a.length - b.length);
						const path =
							paths[0] ??
							(floor.downStair ? route(floor.downStair.coordinate) : null);
						if (!path?.length) {
							reason = "no route";
							break;
						}
						action = { type: "move", direction: path[0] };
					}
				}
				observeReviewEquipment(metrics, state, observedEquipment);
				const previousFloor = state.run.activeFloor;
				actions.push(action);
				const before = state.monsters.length;
				const consumed =
					action.type === "consume"
						? state.bag.items.find((item) => item.id === action.itemId)
						: null;
				const result = resolvePlayerAction(state, action);
				if (!result.turnAdvanced)
					throw new Error(
						`Policy ${options.policy} rejected action at seed ${seed}, turn ${state.turn}: ${JSON.stringify(action)} (${result.error ?? "no committed turn"})`,
					);
				recordReviewTurn(metrics, state, action, result.state);
				state = result.state;
				if (consumed) {
					potionUses[consumed.kind] = (potionUses[consumed.kind] ?? 0) + 1;
					potions++;
				}
				if (action.type === "cast")
					casts[action.spell] = (casts[action.spell] ?? 0) + 1;

				kills += before - state.monsters.length;

				visited.add(state.run.activeFloor);
				if (state.run.activeFloor !== previousFloor)
					checkpoints.push({
						floor: state.run.activeFloor,
						turn: state.turn,
						level: levelForExperience(state.progression.experience),
						experience: state.progression.experience,
						health: state.player.health,
						maxHealth: state.player.maxHealth,
						mana: state.mana,
						maximumMana: maximumMana(state.progression, state.equipment),
					});
			}
			if (state.quest.victory) reason = "won";
			else if (state.player.health <= 0) reason = "died";
			const result = {
				policy: options.policy,
				casts,
				potionUses,
				mana: state.mana,
				maximumMana: maximumMana(state.progression, state.equipment),
				knownSpells: state.knownSpells,
				configuration,
				manaRecoveryInterval: MANA_RECOVERY_INTERVAL,
				maxActions: options.maxActions,
				attributes: deriveAttributes(state.progression),
				seed,
				level: levelForExperience(state.progression.experience),
				experience: state.progression.experience,
				maxHealth: state.player.maxHealth,
				checkpoints,
				...(process.env.LARN_REVIEW_TRACE ? { actions } : {}),
				reason,
				cureRecovered: state.quest.cureRecovered,
				victory: state.quest.victory,
				deepest: Math.max(...visited),
				turns: state.turn,
				health: state.player.health,
				kills,
				potions,
				...metrics,
				decisions: {
					dodgeSteps: tacticalMemory.dodgeSteps ?? 0,
					coverSteps: tacticalMemory.coverSteps ?? 0,
				},
				equipment: Object.fromEntries(
					Object.entries(state.equipment).map(([slot, item]) => [
						slot,
						item?.kind ?? null,
					]),
				),
				initial,
			};
			results.push(result);
			if (!options.summaryOnly) console.log(JSON.stringify(result));
		}
		console.log(
			JSON.stringify({
				...summarizeReviews(results, configuration, options.maxActions),
				policy: options.policy,
				manaRecoveryInterval: MANA_RECOVERY_INTERVAL,
				...summarizeReviewMetrics(results),
				casts: sumCounts(results.map((result) => result.casts)),
				potionUses: sumCounts(results.map((result) => result.potionUses)),
			}),
		);
	}
} catch (error) {
	console.error(error.message);
	process.exitCode = 1;
} finally {
	await server.close();
}
