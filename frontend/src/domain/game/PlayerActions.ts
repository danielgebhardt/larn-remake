import {
	MOVEMENT_OFFSETS,
	type MovementDirection,
	moveDungeonRun,
} from "../dungeon/DungeonRun.ts";
import { type ConsumeAction, consumeItem } from "../items/Consumables";
import {
	changeEquipment,
	type EquipmentAction,
} from "../items/EquipmentChanges";
import { resourcesAfterEquipmentChange } from "../items/EquipmentResources";
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
import { triggerArrivalTrap } from "../objects/DungeonTraps";
import { collectGoldAtPlayer } from "../objects/Gold";
import { navigationRun } from "../objects/NavigationTerrain";
import { announceObjectArrival } from "../objects/ObjectDescriptions";
import {
	type InteractAction,
	interactObject,
} from "../objects/ObjectInteraction";
import { type ActivityEvent, appendActivityEvents } from "./ActivityHistory.ts";
import { type AttackRollSource, createAttackRolls } from "./CombatRandomness";
import { deriveCombatStats } from "./CombatStats";
import type { GameState } from "./GameState.ts";
import { recoverManaAfterTurn } from "./Mana";
import {
	attackProfile,
	deriveAccuracy,
	resolveMeleeAttack,
} from "./MeleeRules";
import { damageMonster } from "./MonsterDamage";
import { levelForExperience } from "./Progression";
import { type CastAction, castSpell } from "./SpellCasting";
import {
	assignSpell,
	fillNewSpellSlots,
	type SpellAssignmentAction,
} from "./SpellHotbar";
import { advanceTimedEffects } from "./TimedEffects";
export type PlayerAction =
	| InteractAction
	| { type: "move"; direction: MovementDirection }
	| { type: "wait" }
	| CastAction
	| EquipmentAction
	| ConsumeAction
	| HotbarAction
	| FloorItemAction
	| SpellAssignmentAction;

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
	if (action.type === "assign-spell") {
		const slots = assignSpell(state.spellHotbar, state.knownSpells, action);
		if ("error" in slots)
			return { state, turnAdvanced: false, error: slots.error };
		return {
			state:
				slots === state.spellHotbar ? state : { ...state, spellHotbar: slots },
			turnAdvanced: false,
		};
	}
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
	if (state.player.health <= 0)
		return {
			state,
			turnAdvanced: false,
			...(action.type === "cast"
				? { error: "You cannot cast after death." }
				: {}),
		};
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
	// Effects receive the committed turn; only this boundary advances it.
	const committed = { ...state, turn: state.turn + 1 };
	const effect = resolvePlayerEffect(committed, action, rollSource);
	const result =
		effect && !("error" in effect)
			? announceObjectArrival(
					state,
					triggerArrivalTrap(collectGoldAtPlayer(effect)),
				)
			: effect;
	if (!result) return { state, turnAdvanced: false };
	if ("error" in result)
		return { state, turnAdvanced: false, error: result.error };
	return {
		state:
			result.quest.victory || result.player.health <= 0
				? result
				: recoverManaAfterTurn(
						advanceTimedEffects(resolveMonsterPhase(result, rollSource)),
					),
		turnAdvanced: true,
	};
};

// Free assignments and hotbar aliases are handled before committing a turn.
const resolvePlayerEffect = (
	state: GameState,
	action: Exclude<PlayerAction, HotbarAction | SpellAssignmentAction>,
	rollSource: AttackRollSource,
): GameState | { error: string } | undefined => {
	const turn = state.turn;
	if (action.type === "interact") return interactObject(state, action);
	if (action.type === "cast") {
		const cast = castSpell(state, action, rollSource);
		return "error" in cast ? cast : cast.state;
	}
	if (action.type === "consume") {
		const consumed = consumeItem(state, action);
		if ("error" in consumed) return consumed;
		return {
			...state,
			player: consumed.player,
			mana: consumed.mana,
			bag: consumed.bag,
			effects: consumed.effects,
			activityHistory: appendActivityEvents(state.activityHistory, [
				{ ...consumed.event, turn },
			]),
		};
	}
	if (action.type === "pickup" || action.type === "drop") {
		const transfer = transferFloorItem(state, action);
		if ("error" in transfer) return transfer;
		return {
			...state,
			bag: transfer.bag,
			equipment: transfer.equipment ?? state.equipment,
			...(transfer.equipment
				? resourcesAfterEquipmentChange(state, transfer.equipment)
				: {}),
			knownSpells: transfer.knownSpells ?? state.knownSpells,
			spellHotbar: fillNewSpellSlots(
				state.spellHotbar,
				state.knownSpells,
				transfer.knownSpells ?? state.knownSpells,
			),
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
			activityHistory: appendActivityEvents(state.activityHistory, [
				{ ...transfer.event, turn },
				...(transfer.equipEvent ? [{ ...transfer.equipEvent, turn }] : []),
			]),
		};
	}
	if (action.type === "equip" || action.type === "unequip") {
		const change = changeEquipment(state.equipment, state.bag, action);
		if ("error" in change) return change;
		return {
			...state,
			equipment: change.equipment,
			...resourcesAfterEquipmentChange(state, change.equipment),
			bag: change.bag,
			activityHistory: appendActivityEvents(state.activityHistory, [
				{ ...change.event, turn },
			]),
		};
	}
	if (action.type === "wait") return state;
	// Movement applies one transition; occupied destinations attack from the
	// original position. Spawn and pursuit keep stair arrivals unoccupied.
	const offset = MOVEMENT_OFFSETS[action.direction];
	const destination = {
		row: state.run.playerCoordinate.row + offset.row,
		col: state.run.playerCoordinate.col + offset.col,
	};
	const door = state.objects.find(
		(object) =>
			object.kind === "door" &&
			!object.activated &&
			object.floorNumber === state.run.activeFloor &&
			object.coordinate.row === destination.row &&
			object.coordinate.col === destination.col,
	);
	if (door)
		return interactObject(state, { type: "interact", objectId: door.id });
	const navigation = navigationRun(state);
	const moved = moveDungeonRun(navigation, action.direction);
	if (moved === navigation) return undefined;
	const run = {
		...state.run,
		activeFloor: moved.activeFloor,
		playerCoordinate: moved.playerCoordinate,
	};
	const monster = state.monsters.find(
		(monster) =>
			monster.floorNumber === state.run.activeFloor &&
			monster.floorNumber === run.activeFloor &&
			monster.health > 0 &&
			monster.coordinate.row === run.playerCoordinate.row &&
			monster.coordinate.col === run.playerCoordinate.col,
	);
	return monster
		? resolveAttack(state, monster, rollSource)
		: announceArrival({ ...state, run }, state.run.activeFloor);
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
						gold: state.gold,
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
	const turn = state.turn;

	const outcome = resolveMeleeAttack(
		attackProfile(
			deriveCombatStats(state.equipment, state.progression, state.effects)
				.attack,
			deriveAccuracy(state.progression, state.effects, state.equipment)
				.playerHitThreshold,
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
			activityHistory: appendActivityEvents(state.activityHistory, [
				{ type: "player-missed", turn, monster: monster.kind },
			]),
		};
	return damageMonster(state, monster, outcome.damage, { type: "player-hit" });
};
