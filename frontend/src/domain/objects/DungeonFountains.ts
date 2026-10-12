import { hashStringToUint32 } from "../dungeon/DungeonRun";
import { createSeededRandom } from "../dungeon/Seed";
import { appendActivityEvents } from "../game/ActivityHistory";
import type { GameState } from "../game/GameState";
import { maximumMana } from "../game/Mana";
import { applyPlayerEffect } from "../game/TimedEffects";
import type { DungeonObject } from "./DungeonObject";
import { objectDamage, spendObject } from "./ObjectEffects";
import type { ObjectChoice } from "./ObjectInteraction";
export const drawFountain = (
	state: GameState,
	object: DungeonObject,
	choice?: ObjectChoice,
): GameState | { error: string } => {
	if (object.activated) return { error: "This fountain is dry." };
	if (choice !== "sip" && choice !== "draw")
		return { error: "Choose a safe sip or risky draw." };
	const maximum = maximumMana(state.progression, state.equipment);
	if (
		choice === "sip" &&
		state.player.health === state.player.maxHealth &&
		state.mana === maximum
	)
		return { error: "Your health and mana are already full." };
	const spent = spendObject(state, object);
	const roll = createSeededRandom(
		hashStringToUint32(`${state.run.seed}:${object.id}:draw`),
	)();
	if (choice === "draw" && roll >= 0.6) {
		const hurt = objectDamage(spent, 3, {
			type: "fountain-poisoned",
			damage: 3,
			turn: state.turn,
		});
		return hurt.player.health > 0 ? applyPlayerEffect(hurt, "poisoned") : hurt;
	}
	const health = Math.min(
		choice === "sip" ? 3 : 8,
		state.player.maxHealth - state.player.health,
	);
	const mana = Math.min(choice === "sip" ? 2 : 6, maximum - state.mana);
	return {
		...spent,
		player: { ...state.player, health: state.player.health + health },
		mana: state.mana + mana,
		activityHistory: appendActivityEvents(state.activityHistory, [
			{ type: "fountain-restored", health, mana, turn: state.turn },
		]),
	};
};
