// One-step threat assessment for diagnostics, not a player AI or gameplay rule.
import { DEFAULT_FOG_CONFIGURATION } from "../src/domain/dungeon/RunConfiguration";
import {
	calculateVisibility,
	hasLineOfSight,
} from "../src/domain/dungeon/Visibility";
import { deriveCombatStats } from "../src/domain/game/CombatStats";
import { isSpellTarget } from "../src/domain/game/SpellCasting";
import { SPELL_DEFINITIONS, spellPotency } from "../src/domain/game/Spells";
import { MONSTER_DEFINITIONS } from "../src/domain/monsters/Monster";
import {
	coordinateKey,
	orthogonalDistance,
} from "../src/domain/monsters/MonsterLocations";
import { chooseSpellAwareAction } from "./review-policy.mjs";
import { createRoutes } from "./review-routing.mjs";

const steps = [
	["up", -1, 0],
	["right", 0, 1],
	["down", 1, 0],
	["left", 0, -1],
];
// Memory belongs only to this diagnostic run; it never enters GameState or saves.
export function chooseTacticalAwareAction(state, route, memory = {}) {
	const base = chooseSpellAwareAction(state, route);
	const floor = state.run.floors[state.run.activeFloor - 1];
	const position = state.run.playerCoordinate;
	const sight = calculateVisibility(
		floor.terrain,
		position,
		DEFAULT_FOG_CONFIGURATION.radius,
	);
	const living = state.monsters.filter(
		(actor) => actor.floorNumber === floor.floorNumber && actor.health > 0,
	);
	const seen = living.filter(
		(actor) => sight[actor.coordinate.row]?.[actor.coordinate.col],
	);
	const occupied = new Set(
		living.map((actor) => coordinateKey(actor.coordinate)),
	);
	const stairs = new Set(
		[floor.upStair?.coordinate, floor.downStair?.coordinate]
			.filter(Boolean)
			.map(coordinateKey),
	);
	const threats = seen.filter(
		(actor) => actor.intent.type === "preparing-attack",
	);
	const aimedHere = threats.filter(
		(actor) => orthogonalDistance(actor.intent.target, position) === 0,
	);
	const { armor } = deriveCombatStats(state.equipment, state.progression);
	const potentialDamage = (point) =>
		seen.reduce((total, actor) => {
			const definition = MONSTER_DEFINITIONS[actor.kind];
			const distance = orthogonalDistance(actor.coordinate, point);
			const targeted =
				actor.intent.type === "preparing-attack" &&
				orthogonalDistance(actor.intent.target, point) === 0;
			const dx = actor.coordinate.row - point.row,
				dy = actor.coordinate.col - point.col;
			const detected =
				dx * dx + dy * dy <= definition.detectionRadius ** 2 &&
				hasLineOfSight(floor.terrain, actor.coordinate, point);
			const shooting =
				distance >= 2 && distance <= definition.rangedAttackRange;
			const melee = distance === 1 && !definition.preparesAttack;
			return (
				total +
				(targeted ||
				(actor.intent.type === "idle" && detected && (shooting || melee))
					? Math.max(1, definition.attackDamage - armor)
					: 0)
			);
		}, 0);
	const exits = steps
		.map(([direction, dr, dc]) => ({
			direction,
			coordinate: { row: position.row + dr, col: position.col + dc },
		}))
		.filter(
			({ coordinate }) =>
				floor.terrain[coordinate.row]?.[coordinate.col] === "." &&
				!occupied.has(coordinateKey(coordinate)) &&
				!stairs.has(coordinateKey(coordinate)) &&
				!threats.some(
					(actor) => orthogonalDistance(actor.intent.target, coordinate) === 0,
				),
		)
		.map((exit) => ({ ...exit, damage: potentialDamage(exit.coordinate) }))
		.sort((a, b) => a.damage - b.damage);
	if (aimedHere.length && exits[0]) {
		memory.dodgeSteps = (memory.dodgeSteps ?? 0) + 1;
		return { type: "move", direction: exits[0].direction };
	}
	const missile = SPELL_DEFINITIONS["magic-missile"];
	const canCast =
		state.knownSpells.includes("magic-missile") && state.mana >= missile.cost;
	if (
		aimedHere.length === 1 &&
		canCast &&
		isSpellTarget(state, aimedHere[0], missile) &&
		spellPotency(state.progression, missile).minimumDamage >=
			aimedHere[0].health
	)
		return { type: "cast", spell: "magic-missile", targetId: aimedHere[0].id };
	const shooting = seen.filter((actor) => {
		const range = MONSTER_DEFINITIONS[actor.kind].rangedAttackRange;
		const distance = orthogonalDistance(actor.coordinate, position);
		return (
			actor.intent.type === "idle" &&
			range &&
			distance >= 2 &&
			distance <= range &&
			hasLineOfSight(floor.terrain, actor.coordinate, position)
		);
	});
	// Recover behind cover when possible. Otherwise only take a cover step
	// that shortens a route toward a shooter, preventing repeated retreat loops.
	if (shooting.length) {
		const currentDamage = potentialDamage(position);
		const recovery =
			base?.type === "consume" ||
			(base?.type === "cast" && base.spell === "heal");
		const justSheltered =
			recovery &&
			memory.lastCover?.floor === floor.floorNumber &&
			memory.lastCover.turn === state.turn - 1;
		const cover =
			!justSheltered &&
			exits.find(
				(exit) =>
					exit.damage < currentDamage &&
					(recovery ||
						shooting.some((actor) => {
							const before = route(actor.coordinate);
							const after = createRoutes(
								floor,
								exit.coordinate,
							)(actor.coordinate);
							return before && after && after.length < before.length;
						})),
			);
		if (cover) {
			memory.lastCover = { floor: floor.floorNumber, turn: state.turn };
			memory.coverSteps = (memory.coverSteps ?? 0) + 1;
			return { type: "move", direction: cover.direction };
		}
		if (base?.type === "cast" && base.spell === "magic-missile") {
			const target = shooting.find((actor) =>
				isSpellTarget(state, actor, missile),
			);
			if (target) return { ...base, targetId: target.id };
		}
	}
	return base;
}
