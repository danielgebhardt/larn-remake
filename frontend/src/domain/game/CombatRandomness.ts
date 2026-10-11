import { hashStringToUint32 } from "../dungeon/DungeonRun";
import { createSeededRandom } from "../dungeon/Seed";
import type { MeleeRolls } from "./MeleeRules";

export type AttackContext = {
	seed: number;
	floorNumber: number;
	turn: number;
	attackerId: string;
	targetId: string;
};
export type AttackRollSource = (context: AttackContext) => MeleeRolls;
export const createAttackRolls: AttackRollSource = (context) => {
	const randomFor = (purpose: "hit" | "damage") =>
		createSeededRandom(
			hashStringToUint32(
				JSON.stringify([
					context.seed,
					context.floorNumber,
					context.turn,
					"combat",
					context.attackerId,
					context.targetId,
					purpose,
				]),
			),
		)();
	return {
		d20: () => 1 + Math.floor(randomFor("hit") * 20),
		damage: (min, max) =>
			min + Math.floor(randomFor("damage") * (max - min + 1)),
	};
};
