// Potential income from ordinary creatures and loose gold, assuming every one
// is collected. Excludes elites, return waves, sales, discoveries and spending.
export const merchantGoldBudget = (state, goldAmount, offers, floors) => {
	const sources = [
		...state.monsters.filter(
			(actor) =>
				actor.kind !== "iron-champion" &&
				Number(actor.id.split(":")[1]) < 10001,
		),
		...state.objects.filter(
			(object) => object.kind === "gold" && !object.activated,
		),
	];
	const potential = (floor) =>
		sources
			.filter((source) => source.floorNumber <= floor)
			.reduce(
				(total, source) =>
					total + goldAmount(state.run.seed, source.floorNumber, source.id),
				0,
			);
	return {
		ordinaryGoldPotential: potential(state.run.floors.length),
		stockClearanceCost: Object.values(offers).reduce(
			(total, offer) => total + offer.price * 10,
			0,
		),
		checkpoints: floors.map((floor) => {
			const gold = potential(floor);
			return {
				floor,
				ordinaryGoldPotential: gold,
				allInBottles: Object.fromEntries(
					Object.entries(offers).map(([kind, offer]) => [
						kind,
						Math.min(10, Math.floor(gold / offer.price)),
					]),
				),
			};
		}),
	};
};
