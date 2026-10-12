import { equipmentSlotFor } from "../src/domain/items/Equipment";
import { compareEquipment } from "../src/domain/items/EquipmentComparison";

const incoming = new Set([
	"monster-hit",
	"monster-shot-hit",
	"monster-heavy-hit",
]);
const outgoing = new Set(["player-hit", "spell-hit"]);
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
		].map((type) => [type, 0]),
	),
	damage: { received: 0, dealt: 0, receivedByKind: {} },
	killsByKind: {},
	levelUps: [],
	equipmentReview: {
		observed: { better: 0, same: 0, lower: 0 },
		pickedUp: { better: 0, same: 0, lower: 0 },
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
	for (const { event, id } of after.activityHistory.entries) {
		if (id < before.activityHistory.nextId) continue;
		if (Object.hasOwn(metrics.combat, event.type)) metrics.combat[event.type]++;
		// Event damage includes overkill, matching the game's established log contract.
		if (incoming.has(event.type)) {
			metrics.damage.received += event.damage;
			metrics.damage.receivedByKind[event.monster] =
				(metrics.damage.receivedByKind[event.monster] ?? 0) + event.damage;
		}
		if (outgoing.has(event.type)) metrics.damage.dealt += event.damage;
		if (event.type === "level-gained")
			metrics.levelUps.push({
				level: event.level,
				floor: after.run.activeFloor,
				turn: event.turn,
			});
		if (event.type === "monster-died")
			metrics.killsByKind[event.monster] =
				(metrics.killsByKind[event.monster] ?? 0) + 1;
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
		killsByKind,
		equipmentReview,
		initial,
		decisions,
		levelUps,
		seed,
	} of results) {
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
			for (const label of ["better", "same", "lower"])
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
