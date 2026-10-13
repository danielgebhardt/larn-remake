// Diagnostics observe committed state; they do not grant resources or change rules.
export const createEscapeReview = () => ({
	recovery: null,
	returnTurns: 0,
	addedEnemies: 0,
	defeatedEnemies: 0,
	potionsUsed: 0,
});
export const recordEscapeReview = (review, before, action, after) => {
	if (!before.quest.cureRecovered && after.quest.cureRecovered) {
		review.recovery = {
			turn: after.turn,
			floor: after.run.activeFloor,
			health: after.player.health,
			mana: after.mana,
			experience: after.progression.experience,
			gold: after.gold,
		};
	}
	if (!before.quest.cureRecovered || after.turn <= before.turn) return;
	review.returnTurns += after.turn - before.turn;
	const existing = new Set(before.monsters.map((actor) => actor.id));
	review.addedEnemies += after.monsters.filter(
		(actor) => !existing.has(actor.id),
	).length;
	review.defeatedEnemies += after.monstersDefeated - before.monstersDefeated;
	if (action.type === "consume") review.potionsUsed++;
};

export const escapePressurePlugin = (getOptions) => ({
	name: "diagnostic-escape-pressure",
	transform(code, id) {
		if (!getOptions()?.disableEscapePressure) return;
		const source = id.endsWith("/src/domain/game/Escape.ts")
			? "const snapshot = state.escape;"
			: id.endsWith("/src/domain/monsters/PursuitRules.ts")
				? "state.escape &&"
				: null;
		if (!source) return;
		if (!code.includes(source))
			throw new Error(
				"Cannot apply diagnostic escape comparison: rule declaration changed.",
			);
		return code.replace(
			source,
			source.startsWith("const")
				? `return state;\n${source}`
				: `false && ${source}`,
		);
	},
});
