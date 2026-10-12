import { spellArea } from "../src/domain/game/AreaSpells";
import { isSpellTarget } from "../src/domain/game/SpellCasting";
import { SPELL_DEFINITIONS, spellPotency } from "../src/domain/game/Spells";
import {
	coordinateKey,
	orthogonalDistance,
} from "../src/domain/monsters/MonsterLocations";
import { resistedDamage } from "../src/domain/monsters/MonsterResistance";
import { navigationRun } from "../src/domain/objects/NavigationTerrain";

// Estimates use catalog ranges, not the hidden deterministic combat roll.
export function chooseDamageSpell(state, seen) {
	const floor = navigationRun(state).floors[state.run.activeFloor - 1];
	const candidates = [];
	for (const spell of state.knownSpells) {
		const definition = SPELL_DEFINITIONS[spell];
		if (definition.effect !== "damage" || definition.cost > state.mana)
			continue;
		const potency = spellPotency(
			state.progression,
			definition,
			state.equipment,
		);
		const targets =
			definition.mode === "self"
				? [null]
				: seen.filter((actor) => isSpellTarget(state, actor, definition));
		for (const target of targets) {
			const center = target?.coordinate ?? state.run.playerCoordinate;
			const area =
				"radius" in definition
					? new Set(
							spellArea(floor.terrain, center, definition.radius).map(
								coordinateKey,
							),
						)
					: null;
			const hit = area
				? seen.filter((actor) => area.has(coordinateKey(actor.coordinate)))
				: [target];
			if (!hit.length) continue;
			let value = 0;
			for (const actor of hit) {
				const minimum = resistedDamage(
					actor.kind,
					potency.minimumDamage,
					definition.element ?? "arcane",
				);
				const average = resistedDamage(
					actor.kind,
					Math.floor((potency.minimumDamage + potency.maximumDamage) / 2),
					definition.element ?? "arcane",
				);
				value += Math.min(actor.health, average);
				if (minimum >= actor.health) value += 3;
				const afflicted = state.effects.some(
					(e) => e.actorId === actor.id && e.kind === definition.condition,
				);
				if (definition.condition && !afflicted)
					value += definition.condition === "poisoned" ? 3 : 2;
				if (definition.lifeDrain)
					value += Math.min(
						average,
						state.player.maxHealth - state.player.health,
					);
			}
			candidates.push({
				action: {
					type: "cast",
					spell,
					...(target ? { targetId: target.id } : {}),
				},
				score: value / definition.cost,
				distance: target
					? orthogonalDistance(target.coordinate, state.run.playerCoordinate)
					: 0,
			});
		}
	}
	candidates.sort(
		(a, b) =>
			b.score - a.score ||
			a.distance - b.distance ||
			a.action.spell.localeCompare(b.action.spell),
	);
	return candidates[0]?.action;
}
