import type { VisibilityGrid } from "../../domain/dungeon/Visibility";
import {
	MONSTER_DEFINITIONS,
	type Monster,
	type MonsterKind,
} from "../../domain/monsters/Monster";
import { monsterTraits } from "../../domain/monsters/MonsterTraits";
import MonsterIcon from "./MonsterIcon";

const ObservedCreatures = ({
	monsters = [],
	visible,
}: {
	monsters?: readonly Monster[];
	visible?: VisibilityGrid;
}) => {
	const kinds = [
		...new Set(
			monsters
				.filter(
					(actor) =>
						actor.health > 0 &&
						(visible === undefined ||
							visible[actor.coordinate.row]?.[actor.coordinate.col]),
				)
				.map((actor) => actor.kind),
		),
	].sort((a, b) =>
		MONSTER_DEFINITIONS[a].name.localeCompare(MONSTER_DEFINITIONS[b].name),
	);
	return (
		<section
			aria-label="Visible creatures"
			className="grid gap-3 rounded-lg border p-4 text-sm"
		>
			<h3 className="font-medium">Visible creatures</h3>
			<p className="text-xs text-muted-foreground">
				Only creatures currently in sight are listed. Browsing this guide is
				free.
			</p>
			{kinds.length === 0 ? (
				<p>No creatures currently in sight.</p>
			) : (
				kinds.map((kind: MonsterKind) => {
					const definition = MONSTER_DEFINITIONS[kind];
					return (
						<section key={kind} className="grid gap-2 border-t pt-3">
							<h4 className="flex items-center gap-2 font-medium">
								<span className="size-5">
									<MonsterIcon kind={kind} />
								</span>
								{definition.name}
							</h4>
							<p className="text-xs text-muted-foreground">
								Maximum health {definition.maxHealth} ·{" "}
								{definition.areaAttack
									? `blast damage ${definition.areaAttack.minDamage}–${definition.areaAttack.maxDamage}`
									: definition.enemySpells
										? "damage varies by spell"
										: `melee damage ${Math.max(1, definition.attackDamage - 1)}–${definition.attackDamage + 1}`}
							</p>
							<ul className="list-disc space-y-1 pl-4 text-xs">
								{monsterTraits(kind).map((trait) => (
									<li key={trait}>{trait}</li>
								))}
							</ul>
						</section>
					);
				})
			)}
		</section>
	);
};
export default ObservedCreatures;
