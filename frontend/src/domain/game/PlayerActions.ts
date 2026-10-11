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
import { createMonsterDrop } from "../items/MonsterDrops";
import {
	assignPickedUpPotion,
	changeHotbarAssignment,
	HOTBAR_SLOTS,
	type HotbarAction,
	hotbarSlotContents,
} from "../items/PotionHotbar";
import { MONSTER_DEFINITIONS } from "../monsters/Monster";
import type { Monster } from "../monsters/Monster.ts";
import { resolveMonsterPhase } from "../monsters/MonsterTurns";
import { type ActivityEvent, appendActivityEvents } from "./ActivityHistory.ts";
import { strengthAtLevel } from "./Attributes";
import { type AttackRollSource, createAttackRolls } from "./CombatRandomness";
import { deriveCombatStats } from "./CombatStats";
import type { GameState } from "./GameState.ts";
import {
	attackProfile,
	PLAYER_HIT_THRESHOLD,
	resolveMeleeAttack,
} from "./MeleeRules";
import {
	gainExperience,
	HEALTH_PER_LEVEL,
	levelForExperience,
} from "./Progression";

export type PlayerAction =
	| { type: "move"; direction: MovementDirection }
	| { type: "wait" }
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
	if (state.quest.victory) return { state, turnAdvanced: false };
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
	if (state.player.health <= 0) return { state, turnAdvanced: false };
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
			PLAYER_HIT_THRESHOLD,
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
	const damage = outcome.damage;
	const health = Math.max(0, monster.health - damage);
	const events: ActivityEvent[] = [
		{
			type: "player-hit",
			turn,
			monster: monster.kind,
			damage,
		},
	];
	if (health === 0)
		events.push({ type: "monster-died", turn, monster: monster.kind });
	let floorItems = state.floorItems;
	let player = state.player;
	let progression = state.progression;
	if (health === 0) {
		const reward = MONSTER_DEFINITIONS[monster.kind].experienceReward;
		const gained = gainExperience(progression, player, reward);
		progression = gained.progression;
		player = gained.player;
		events.push({ type: "experience-gained", amount: reward, turn });
		for (const level of gained.levels) {
			events.push({
				type: "level-gained",
				level,
				healthGain: HEALTH_PER_LEVEL,
				turn,
			});
			if (strengthAtLevel(level) > strengthAtLevel(level - 1))
				events.push({
					type: "attribute-gained",
					attribute: "Strength",
					value: strengthAtLevel(level),
					turn,
				});
		}
		const drop = createMonsterDrop(state.run.seed, monster);
		if (drop && !floorItems.some((entry) => entry.item.id === drop.item.id)) {
			floorItems = [...floorItems, drop];
			// A bump kill is on a visible adjacent walkable tile. No hidden-floor
			// or remote monster deaths are resolved by this action.
			events.push({
				type: "monster-loot",
				turn,
				monster: monster.kind,
				item: drop.item.kind,
			});
		}
	}
	const monsters =
		health > 0
			? state.monsters.map((actor) =>
					actor.id === monster.id ? { ...actor, health } : actor,
				)
			: state.monsters.filter((actor) => actor.id !== monster.id);
	return {
		...state,
		turn,
		monsters,
		monstersDefeated: state.monstersDefeated + (health === 0 ? 1 : 0),
		player,
		progression,
		floorItems,
		activityHistory: appendActivityEvents(state.activityHistory, events),
	};
};
