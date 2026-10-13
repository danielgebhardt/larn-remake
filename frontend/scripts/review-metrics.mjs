import { DEFAULT_FOG_CONFIGURATION } from "../src/domain/dungeon/RunConfiguration";
import { hasLineOfSight } from "../src/domain/dungeon/Visibility";
import { equipmentSlotFor } from "../src/domain/items/Equipment";
import { compareEquipment } from "../src/domain/items/EquipmentComparison";
import { orthogonalDistance } from "../src/domain/monsters/MonsterLocations";
import { navigationRun } from "../src/domain/objects/NavigationTerrain";

const incoming = new Set([
	"monster-hit",
	"monster-charge-hit",
	"monster-shot-hit",
	"monster-heavy-hit",
	"monster-spell-hit",
	"monster-area-hit",
	"player-condition-hit",
	"trap-sprung",
	"throne-wound",
	"fountain-poisoned",
	"discovery-opened",
]);
const outgoing = new Set(["player-hit", "spell-hit", "condition-hit"]);
export const createReviewMetrics = () => ({
	combat: Object.fromEntries(
		[
			"player-hit",
			"player-missed",
			"spell-hit",
			"monster-hit",
			"monster-missed",
			"monster-shot-hit",
			"monster-shot-missed",
			"monster-prepared",
			"monster-heavy-hit",
			"monster-heavy-missed",
			"monster-heavy-avoided",
			"monster-spell-hit",
			"monster-area-hit",
			"monster-area-avoided",
			"monster-area-prepared",
			"player-condition-hit",
			"condition-hit",
		].map((type) => [type, 0]),
	),
	damage: { received: 0, dealt: 0, receivedByKind: {} },
	killsByKind: {},
	discoveries: {},
	travel: {
		moves: 0,
		unchallengedMoves: 0,
		longestQuietStreak: 0,
		currentQuietStreak: 0,
	},
	levelUps: [],
	equipmentReview: {
		observed: { better: 0, same: 0, lower: 0, tradeoff: 0 },
		pickedUp: { better: 0, same: 0, lower: 0, tradeoff: 0 },
		upgrades: 0,
	},
});
// Count each ground equipment copy once, when its floor is first inspected by
// the omniscient policy, comparing against equipment held at that moment.
export const observeReviewEquipment = (metrics, state, seen) => {
	for (const entry of state.floorItems) {
		if (entry.floorNumber !== state.run.activeFloor || seen.has(entry.item.id))
			continue;
		const comparison = compareEquipment(entry.item, state.equipment);
		if (!comparison) continue;
		seen.add(entry.item.id);
		metrics.equipmentReview.observed[comparison.label.toLowerCase()]++;
	}
};
export const recordReviewTurn = (metrics, before, action, after) => {
	const travel = metrics.travel;
	const moved =
		action.type === "move" &&
		(before.run.activeFloor !== after.run.activeFloor ||
			orthogonalDistance(
				before.run.playerCoordinate,
				after.run.playerCoordinate,
			) > 0);
	if (moved) {
		travel.moves++;
		const terrain =
			navigationRun(before).floors[before.run.activeFloor - 1].terrain;
		const challenged = before.monsters.some(
			(actor) =>
				actor.health > 0 &&
				actor.floorNumber === before.run.activeFloor &&
				orthogonalDistance(actor.coordinate, before.run.playerCoordinate) <=
					DEFAULT_FOG_CONFIGURATION.radius &&
				hasLineOfSight(terrain, before.run.playerCoordinate, actor.coordinate),
		);
		if (!challenged) {
			travel.unchallengedMoves++;
			travel.currentQuietStreak++;
			travel.longestQuietStreak = Math.max(
				travel.longestQuietStreak,
				travel.currentQuietStreak,
			);
		} else travel.currentQuietStreak = 0;
	} else travel.currentQuietStreak = 0;

	for (const { event, id } of after.activityHistory.entries) {
		if (id < before.activityHistory.nextId) continue;
		if (Object.hasOwn(metrics.combat, event.type)) metrics.combat[event.type]++;
		// Event damage includes overkill, matching the game's established log contract.
		if (incoming.has(event.type)) {
			metrics.damage.received += event.damage;
			metrics.damage.receivedByKind[event.monster ?? "environment"] =
				(metrics.damage.receivedByKind[event.monster ?? "environment"] ?? 0) +
				event.damage;
		}
		if (outgoing.has(event.type)) metrics.damage.dealt += event.damage;
		if (
			[
				"chest-opened",
				"discovery-opened",
				"shrine-offered",
				"fountain-restored",
				"gold-collected",
				"item-cleansed",
			].includes(event.type)
		)
			metrics.discoveries[event.type] =
				(metrics.discoveries[event.type] ?? 0) + 1;
		if (event.type === "level-gained")
			metrics.levelUps.push({
				level: event.level,
				floor: after.run.activeFloor,
				turn: event.turn,
			});
		if (event.type === "monster-died")
			metrics.killsByKind[event.monster ?? "environment"] =
				(metrics.killsByKind[event.monster ?? "environment"] ?? 0) + 1;
	}
	if (action.type === "equip" && after.equipment !== before.equipment) {
		const item = before.bag.items.find((item) => item.id === action.itemId);
		if (item && compareEquipment(item, before.equipment)?.label === "Better")
			metrics.equipmentReview.upgrades++;
	}
	if (action.type === "pickup" && before.floorItems !== after.floorItems) {
		const item = before.floorItems.find(
			(entry) => entry.item.id === action.itemId,
		)?.item;
		if (item && equipmentSlotFor(item))
			metrics.equipmentReview.pickedUp[
				compareEquipment(item, before.equipment).label.toLowerCase()
			]++;
	}
};
export const summarizeReviewMetrics = (results) => {
	const totals = {
		...createReviewMetrics(),
		monsterMixture: {},
		decisions: { dodgeSteps: 0, coverSteps: 0 },
	};
	for (const {
		combat,
		damage,
		discoveries,
		travel,
		killsByKind,
		equipmentReview,
		initial,
		decisions,
		levelUps,
		seed,
	} of results) {
		if (travel) {
			totals.travel.moves += travel.moves;
			totals.travel.unchallengedMoves += travel.unchallengedMoves;
			totals.travel.longestQuietStreak = Math.max(
				totals.travel.longestQuietStreak,
				travel.longestQuietStreak,
			);
		}
		for (const [kind, count] of Object.entries(discoveries ?? {}))
			totals.discoveries[kind] = (totals.discoveries[kind] ?? 0) + count;
		for (const [type, count] of Object.entries(combat))
			totals.combat[type] += count;
		totals.damage.received += damage.received;
		totals.damage.dealt += damage.dealt;
		for (const [kind, count] of Object.entries(damage.receivedByKind))
			totals.damage.receivedByKind[kind] =
				(totals.damage.receivedByKind[kind] ?? 0) + count;
		for (const [kind, count] of Object.entries(killsByKind))
			totals.killsByKind[kind] = (totals.killsByKind[kind] ?? 0) + count;
		for (const category of ["observed", "pickedUp"])
			for (const label of ["better", "same", "lower", "tradeoff"])
				totals.equipmentReview[category][label] +=
					equipmentReview[category][label];
		totals.equipmentReview.upgrades += equipmentReview.upgrades;
		totals.levelUps.push(...levelUps.map((entry) => ({ seed, ...entry })));
		for (const key of ["dodgeSteps", "coverSteps"])
			totals.decisions[key] += decisions?.[key] ?? 0;
		for (const { kind } of initial.monsters)
			totals.monsterMixture[kind] = (totals.monsterMixture[kind] ?? 0) + 1;
	}
	return totals;
};
