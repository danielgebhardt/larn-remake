import { maximumMana } from "../src/domain/game/Mana";
import { levelForExperience } from "../src/domain/game/Progression";
import { compareEquipment } from "../src/domain/items/EquipmentComparison";
import { ITEM_DEFINITIONS } from "../src/domain/items/Item";
import { createReviewMetrics, recordReviewTurn } from "./review-metrics.mjs";

const snapshot = (state) => ({
	turn: state.turn,
	level: levelForExperience(state.progression.experience),
	experience: state.progression.experience,
	health: state.player.health,
	maxHealth: state.player.maxHealth,
	mana: state.mana,
	maximumMana: maximumMana(state.progression, state.equipment, state.effects),
	gold: state.gold,
});
const visit = (state) => ({
	floor: state.run.activeFloor,
	phase: state.quest.cureRecovered ? "return" : "descent",
	arrival: snapshot(state),
	exit: snapshot(state),
	turns: 0,
	combatTurns: 0,
	quietMoves: 0,
	kills: 0,
	usefulUpgrades: 0,
	suppliesUsed: {},
	damageReceived: 0,
});
export const createPacingReview = (state) => ({ visits: [visit(state)] });
export const recordPacingTurn = (review, before, action, after) => {
	if (after.turn === before.turn) return;
	const current = review.visits.at(-1);
	const metrics = createReviewMetrics();
	recordReviewTurn(metrics, before, action, after);
	const events = after.activityHistory.entries
		.filter(({ id }) => id >= before.activityHistory.nextId)
		.map(({ event }) => event);
	current.turns += after.turn - before.turn;
	current.combatTurns += Number(
		events.some((event) =>
			/^(player-hit|player-missed|spell-hit|condition-hit|monster-(hit|missed|shot|heavy|spell|area|charge))/.test(
				event.type,
			),
		),
	);
	current.quietMoves += metrics.travel.unchallengedMoves;
	current.kills += events.filter(
		(event) => event.type === "monster-died",
	).length;
	current.damageReceived += metrics.damage.received;
	current.usefulUpgrades += metrics.equipmentReview.upgrades;
	// Pickup can now equip directly into an empty slot.
	if (action.type === "pickup") {
		const item = before.floorItems.find(
			(entry) => entry.item.id === action.itemId,
		)?.item;
		if (
			item &&
			Object.values(after.equipment).some(
				(equipped) => equipped?.id === item.id,
			) &&
			compareEquipment(item, before)?.label === "Better"
		)
			current.usefulUpgrades++;
	}
	if (action.type === "consume") {
		const item = before.bag.items.find((item) => item.id === action.itemId);
		if (item && ITEM_DEFINITIONS[item.kind].type === "potion")
			current.suppliesUsed[item.kind] =
				(current.suppliesUsed[item.kind] ?? 0) + 1;
	}
	current.exit = snapshot(after);
	if (
		after.run.activeFloor !== before.run.activeFloor ||
		after.quest.cureRecovered !== before.quest.cureRecovered
	)
		review.visits.push(visit(after));
};
