import {
	type MovementDirection,
	moveDungeonRun,
} from "../dungeon/DungeonRun.ts";
import { type ConsumeAction, consumeItem } from "../items/Consumables";
import {
	changeEquipment,
	type EquipmentAction,
} from "../items/EquipmentChanges";
import {
	type FloorItemAction,
	itemsAtPlayer,
	transferFloorItem,
} from "../items/FloorItems";
import {
	assignPickedUpPotion,
	changeHotbarAssignment,
	HOTBAR_SLOTS,
	type HotbarAction,
	hotbarSlotContents,
} from "../items/PotionHotbar";
import type { Monster } from "../monsters/Monster.ts";
import { resolveMonsterPhase } from "../monsters/MonsterTurns";
import { type ActivityEvent, appendActivityEvents } from "./ActivityHistory.ts";
import { type AttackRollSource, createAttackRolls } from "./CombatRandomness";
import { deriveCombatStats } from "./CombatStats";
import type { GameState } from "./GameState.ts";
import {
	attackProfile,
	deriveAccuracy,
	resolveMeleeAttack,
} from "./MeleeRules";
import { damageMonster } from "./MonsterDamage";
import { levelForExperience } from "./Progression";
import { type CastAction, castSpell } from "./SpellCasting";

export type PlayerAction =
	| { type: "move"; direction: MovementDirection }
	| { type: "wait" }
	| CastAction
	| EquipmentAction
	| ConsumeAction
	| HotbarAction
	| FloorItemAction;

export type ActionResolution = {
	state: GameState;
	turnAdvanced: boolean;
	error?: string;
};

export const resolvePlayerAction = (
	state: GameState,
	action: PlayerAction,
	rollSource: AttackRollSource = createAttackRolls,
): ActionResolution => {
	if (state.quest.victory)
		return {
			state,
			turnAdvanced: false,
			...(action.type === "cast"
				? { error: "The adventure is complete." }
				: {}),
		};
	if (action.type === "assign-hotbar" || action.type === "clear-hotbar") {
		const change = changeHotbarAssignment(
			state.potionHotbar,
			state.bag,
			action,
		);
		if ("error" in change)
			return { state, turnAdvanced: false, error: change.error };
		return {
			state:
				change.potionHotbar === state.potionHotbar
					? state
					: { ...state, potionHotbar: change.potionHotbar },
			turnAdvanced: false,
		};
	}
	const monsterPhase = (next: GameState) =>
		resolveMonsterPhase(next, rollSource);
	if (state.player.health <= 0)
		return {
			state,
			turnAdvanced: false,
			...(action.type === "cast"
				? { error: "You cannot cast after death." }
				: {}),
		};
	if (action.type === "cast") {
		const cast = castSpell(state, action, rollSource);
		if ("error" in cast)
			return { state, turnAdvanced: false, error: cast.error };
		return { state: monsterPhase(cast.state), turnAdvanced: true };
	}
	if (action.type === "use-hotbar") {
		if (!HOTBAR_SLOTS.includes(action.slot))
			return {
				state,
				turnAdvanced: false,
				error: "Choose a potion slot from 1 to 4.",
			};
		const { kind, item } = hotbarSlotContents(state, action.slot);
		if (!kind)
			return {
				state,
				turnAdvanced: false,
				error: `Potion slot ${action.slot} is empty. Assign a potion in Character.`,
			};
		if (!item)
			return {
				state,
				turnAdvanced: false,
				error: "You have no carried copies of that potion.",
			};
		return resolvePlayerAction(
			state,
			{ type: "consume", itemId: item.id },
			rollSource,
		);
	}
	if (action.type === "consume") {
		const consumed = consumeItem(state.player, state.bag, action);
		if ("error" in consumed)
			return { state, turnAdvanced: false, error: consumed.error };
		const turn = state.turn + 1;
		return {
			state: monsterPhase({
				...state,
				player: consumed.player,
				bag: consumed.bag,
				turn,
				activityHistory: appendActivityEvents(state.activityHistory, [
					{ ...consumed.event, turn },
				]),
			}),
			turnAdvanced: true,
		};
	}
	if (action.type === "pickup" || action.type === "drop") {
		const transfer = transferFloorItem(state, action);
		if ("error" in transfer)
			return { state, turnAdvanced: false, error: transfer.error };
		const turn = state.turn + 1;
		return {
			state: monsterPhase({
				...state,
				bag: transfer.bag,
				quest:
					action.type === "pickup" && transfer.event.item === "cure"
						? { ...state.quest, cureRecovered: true }
						: state.quest,
				floorItems: transfer.floorItems,
				potionHotbar:
					action.type === "pickup"
						? assignPickedUpPotion(
								state.potionHotbar,
								state.bag,
								transfer.event.item,
							)
						: state.potionHotbar,
				turn,
				activityHistory: appendActivityEvents(state.activityHistory, [
					{ ...transfer.event, turn },
				]),
			}),
			turnAdvanced: true,
		};
	}
	if (action.type === "equip" || action.type === "unequip") {
		const change = changeEquipment(state.equipment, state.bag, action);
		if ("error" in change)
			return { state, turnAdvanced: false, error: change.error };
		const turn = state.turn + 1;
		return {
			state: monsterPhase({
				...state,
				equipment: change.equipment,
				bag: change.bag,
				turn,
				activityHistory: appendActivityEvents(state.activityHistory, [
					{ ...change.event, turn },
				]),
			}),
			turnAdvanced: true,
		};
	}
	if (action.type === "wait")
		return {
			state: monsterPhase({ ...state, turn: state.turn + 1 }),
			turnAdvanced: true,
		};
	// Movement validates collision and applies at most one stair transition.
	// An occupied destination resolves combat from the original position instead.
	// Spawn placement excludes stairs and their arrival tiles.
	const run = moveDungeonRun(state.run, action.direction);
	if (run === state.run) return { state, turnAdvanced: false };
	const monster = state.monsters.find(
		(monster) =>
			monster.floorNumber === state.run.activeFloor &&
			monster.floorNumber === run.activeFloor &&
			monster.health > 0 &&
			monster.coordinate.row === run.playerCoordinate.row &&
			monster.coordinate.col === run.playerCoordinate.col,
	);
	const playerResult = monster
		? resolveAttack(state, monster, rollSource)
		: announceArrival(
				{ ...state, run, turn: state.turn + 1 },
				state.run.activeFloor,
			);
	return {
		state: playerResult.quest.victory
			? playerResult
			: monsterPhase(playerResult),
		turnAdvanced: true,
	};
};

const announceArrival = (state: GameState, fromFloor: number): GameState => {
	const events: ActivityEvent[] = [];
	if (state.run.activeFloor !== fromFloor)
		events.push({
			type: "floor-changed",
			fromFloor,
			toFloor: state.run.activeFloor,
			turn: state.turn,
		});
	if (
		state.run.activeFloor === 1 &&
		state.run.playerCoordinate.row === state.quest.entrance.row &&
		state.run.playerCoordinate.col === state.quest.entrance.col
	) {
		if (state.quest.cureRecovered) {
			events.push({ type: "quest-completed", turn: state.turn });
			return {
				...state,
				quest: {
					...state.quest,
					victory: {
						seed: state.run.seed,
						floors: state.quest.goalFloor,
						turns: state.turn,
						monstersDefeated: state.monstersDefeated,
						health: state.player.health,
						level: levelForExperience(state.progression.experience),
						experience: state.progression.experience,
					},
				},
				activityHistory: appendActivityEvents(state.activityHistory, events),
			};
		}
		events.push({
			type: "entrance-reminder",
			goalFloor: state.quest.goalFloor,
			turn: state.turn,
		});
	}
	const items = itemsAtPlayer(state).map((entry) => entry.item.kind);
	if (items.length > 0)
		events.push({ type: "items-seen", items, turn: state.turn });
	if (events.length === 0) return state;
	return {
		...state,
		activityHistory: appendActivityEvents(state.activityHistory, events),
	};
};

const resolveAttack = (
	state: GameState,
	monster: Monster,
	rollSource: AttackRollSource,
): GameState => {
	const turn = state.turn + 1;
	const outcome = resolveMeleeAttack(
		attackProfile(
			deriveCombatStats(state.equipment, state.progression).attack,
			deriveAccuracy(state.progression).playerHitThreshold,
		),
		rollSource({
			seed: state.run.seed,
			floorNumber: state.run.activeFloor,
			turn,
			attackerId: "player",
			targetId: monster.id,
		}),
	);
	if (!outcome.hit)
		return {
			...state,
			turn,
			activityHistory: appendActivityEvents(state.activityHistory, [
				{ type: "player-missed", turn, monster: monster.kind },
			]),
		};
	return damageMonster(state, monster, outcome.damage, {
		type: "player-hit",
		turn,
		monster: monster.kind,
		damage: outcome.damage,
	});
};
