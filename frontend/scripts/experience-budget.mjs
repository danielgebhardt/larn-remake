import { progressionProgress } from "../src/domain/game/Progression";
import { MONSTER_DEFINITIONS } from "../src/domain/monsters/Monster";
// All ordinary kills, in floor order. Optional rewards and escape are additional,
// and avoiding creatures reduces earned XP. This is not a simulated character.
export const experienceBudget = (state) => {
	let experience = 0;
	return state.run.floors.map((floor) => {
		const reward = state.monsters
			.filter(
				(actor) =>
					actor.floorNumber === floor.floorNumber &&
					actor.kind !== "iron-champion" &&
					Number(actor.id.split(":")[1]) < 10001,
			)
			.reduce(
				(sum, actor) => sum + MONSTER_DEFINITIONS[actor.kind].experienceReward,
				0,
			);
		experience += reward;
		const progress = progressionProgress({ experience });
		return {
			floor: floor.floorNumber,
			reward,
			experience,
			level: progress.level,
			toNextLevel: progress.remaining,
		};
	});
};
