import type { VisibilityGrid } from "../../domain/dungeon/Visibility";
import {
	EFFECT_DEFINITIONS,
	type TimedEffect,
} from "../../domain/game/TimedEffects";
import {
	MONSTER_DEFINITIONS,
	type Monster,
} from "../../domain/monsters/Monster";

const effectLabel = (effect: TimedEffect) =>
	`${EFFECT_DEFINITIONS[effect.kind].name} · ${effect.remaining} ${effect.remaining === 1 ? "phase" : "phases"} remaining`;
const VisibleEffects = ({
	effects,
	monsters,
	visible,
}: {
	effects: readonly TimedEffect[];
	monsters: readonly Monster[];
	visible?: VisibilityGrid;
}) => {
	const own = effects.filter((effect) => effect.actorId === "player");
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
	const threats = monsters.flatMap((actor) =>
		actor.health > 0 &&
		actor.intent.type === "preparing-area" &&
		(visible === undefined ||
			visible[actor.coordinate.row]?.[actor.coordinate.col])
			? [{ actor, intent: actor.intent }]
			: [],
	);
	if (!entries.length && !own.length && !threats.length) return null;
	return (
		<div className="mb-2 grid gap-1 text-xs">
			{threats.length > 0 && (
				<ul
					aria-label="Incoming area attacks"
					className="flex flex-wrap justify-center gap-2"
				>
					{threats.map(({ actor, intent }) => (
						<li
							key={actor.id}
							className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-destructive"
						>
							{MONSTER_DEFINITIONS[actor.kind].name}: {intent.element} blast ·{" "}
							{intent.remaining} response{" "}
							{intent.remaining === 1 ? "turn" : "turns"} left
						</li>
					))}
				</ul>
			)}
			{own.length > 0 && (
				<ul
					aria-label="Your conditions"
					className="flex flex-wrap justify-center gap-2"
				>
					{own.map((effect) => (
						<li
							key={effect.kind}
							className={
								effect.kind === "poisoned"
									? "rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-destructive"
									: "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-emerald-800 dark:text-emerald-200"
							}
						>
							{effectLabel(effect)}
						</li>
					))}
				</ul>
			)}
			{entries.length > 0 && (
				<ul
					aria-label="Visible monster conditions"
					className="flex flex-wrap justify-center gap-2"
				>
					{entries.map(({ effect, actor }) => (
						<li
							key={`${effect.actorId}:${effect.kind}`}
							className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-1 text-cyan-800 dark:text-cyan-200"
						>
							{MONSTER_DEFINITIONS[actor.kind].name}: {effectLabel(effect)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
};
export default VisibleEffects;
