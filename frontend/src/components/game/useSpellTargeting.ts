import { useEffect, useMemo, useState } from "react";
import type { VisibilityGrid } from "../../domain/dungeon/Visibility";
import type { GameState } from "../../domain/game/GameState";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import { isSpellTarget } from "../../domain/game/SpellCasting";
import {
	SPELL_DEFINITIONS,
	type SpellKind,
	spellKnowledgeError,
} from "../../domain/game/Spells";
import { MONSTER_DEFINITIONS } from "../../domain/monsters/Monster";
import { orthogonalDistance } from "../../domain/monsters/MonsterLocations";

export const useSpellTargeting = (
	state: GameState,
	visible: VisibilityGrid | undefined,
	enabled: boolean,
	onAction: (action: PlayerAction) => void,
	onError: (message: string) => void,
	focusMap: () => void,
) => {
	const [targeting, setTargeting] = useState<{
		spell: SpellKind;
		id: string;
		terrain: GameState["run"]["floors"][number]["terrain"];
	} | null>(null);
	const targets = useMemo(
		() =>
			state.monsters
				.filter(
					(monster) =>
						isSpellTarget(state, monster) &&
						(!visible ||
							visible[monster.coordinate.row]?.[monster.coordinate.col]),
				)
				.sort(
					(a, b) =>
						orthogonalDistance(a.coordinate, state.run.playerCoordinate) -
							orthogonalDistance(b.coordinate, state.run.playerCoordinate) ||
						a.id.localeCompare(b.id),
				),
		[state, visible],
	);
	const terrain = state.run.floors[state.run.activeFloor - 1].terrain;
	useEffect(() => {
		if (
			targeting &&
			(!enabled ||
				targeting.terrain !== terrain ||
				!targets.some((target) => target.id === targeting.id))
		)
			setTargeting(null);
	}, [targeting, targets, terrain, enabled]);
	const cancel = () => {
		setTargeting(null);
		focusMap();
	};
	const activate = (spell: SpellKind) => {
		if (!enabled) return;
		if (targeting) {
			cancel();
			return;
		}
		const error = spellKnowledgeError(state.knownSpells, spell);
		if (error) {
			onError(error);
			return;
		}
		const definition = SPELL_DEFINITIONS[spell];
		if (state.mana < definition.cost) {
			onError(
				`Not enough mana for ${definition.name}. You need ${definition.cost}.`,
			);
			return;
		}
		if (definition.mode === "self") {
			onAction({ type: "cast", spell });
			focusMap();
			return;
		}
		if (!targets.length) {
			onError("No visible target within range and clear line of sight.");
			return;
		}
		onError("");
		setTargeting({ spell, id: targets[0].id, terrain });
		focusMap();
	};
	const castTarget = (id: string) => {
		if (!targeting || !targets.some((target) => target.id === id)) return;
		onAction({ type: "cast", spell: targeting.spell, targetId: id });
		cancel();
	};
	const handleKey = (key: string) => {
		if (!targeting) return;
		if (key === "Escape" || key.toLowerCase() === "z") {
			cancel();
			return;
		}
		if (key === "Enter") {
			castTarget(targeting.id);
			return;
		}
		const direction =
			key === "ArrowLeft" || key === "ArrowUp"
				? -1
				: key === "ArrowRight" || key === "ArrowDown"
					? 1
					: 0;
		if (direction) {
			const index = targets.findIndex((target) => target.id === targeting.id);
			setTargeting({
				...targeting,
				id: targets[(index + direction + targets.length) % targets.length].id,
			});
		}
	};
	const selected = targets.find((target) => target.id === targeting?.id);
	return {
		activate,
		castTarget,
		handleKey,
		targeting,
		targetIds: targeting ? targets.map((target) => target.id) : undefined,
		description: selected
			? `Magic Missile: ${MONSTER_DEFINITIONS[selected.kind].name} at row ${selected.coordinate.row}, column ${selected.coordinate.col}. Arrows select; Enter or click casts. Escape or Z cancels.`
			: null,
	};
};
