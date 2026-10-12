import type { VisibilityGrid } from "../../domain/dungeon/Visibility";
import {
	EFFECT_DEFINITIONS,
	type TimedEffect,
} from "../../domain/game/TimedEffects";
import {
	MONSTER_DEFINITIONS,
	type Monster,
} from "../../domain/monsters/Monster";

const VisibleEffects = ({
	effects,
	monsters,
	visible,
}: {
	effects: readonly TimedEffect[];
	monsters: readonly Monster[];
	visible?: VisibilityGrid;
}) => {
	const entries = effects.flatMap((effect) => {
		const actor = monsters.find(
			(monster) => monster.id === effect.actorId && monster.health > 0,
		);
		return actor &&
			(visible === undefined ||
				visible[actor.coordinate.row]?.[actor.coordinate.col])
			? [{ effect, actor }]
			: [];
	});
	if (!entries.length) return null;
	return (
		<ul
			aria-label="Visible monster conditions"
			className="mb-2 flex flex-wrap justify-center gap-2 text-xs"
		>
			{entries.map(({ effect, actor }) => (
				<li
					key={`${effect.actorId}:${effect.kind}`}
					className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-cyan-800 dark:text-cyan-200"
				>
					{MONSTER_DEFINITIONS[actor.kind].name}:{" "}
					{EFFECT_DEFINITIONS[effect.kind].name} · {effect.remaining}{" "}
					{effect.remaining === 1 ? "phase" : "phases"} remaining
				</li>
			))}
		</ul>
	);
};
export default VisibleEffects;
