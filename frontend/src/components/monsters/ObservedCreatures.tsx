import type { VisibilityGrid } from "../../domain/dungeon/Visibility";
import { type Difficulty, scaleEnemyValue } from "../../domain/game/Difficulty";
import { SPELL_DEFINITIONS } from "../../domain/game/Spells";
import {
	MONSTER_DEFINITIONS,
	type Monster,
	type MonsterKind,
} from "../../domain/monsters/Monster";
import {
	maximumMonsterHealth,
	monsterDamageRange,
} from "../../domain/monsters/MonsterStats";
import { monsterTraits } from "../../domain/monsters/MonsterTraits";
import MonsterIcon from "./MonsterIcon";

const ObservedCreatures = ({
	monsters = [],
	difficulty = 1,
	visible,
}: {
	monsters?: readonly Monster[];
	difficulty?: Difficulty;
	visible?: VisibilityGrid;
}) => {
	const observed = monsters.filter(
		(actor) =>
			actor.health > 0 &&
			(visible === undefined ||
				visible[actor.coordinate.row]?.[actor.coordinate.col]),
	);
	const kinds = [...new Set(observed.map((actor) => actor.kind))].sort((a, b) =>
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
					const floorNumber = observed.find(
						(actor) => actor.kind === kind,
					)?.floorNumber;
					return (
						<section key={kind} className="grid gap-2 border-t pt-3">
							<h4 className="flex items-center gap-2 font-medium">
								<span className="size-5">
									<MonsterIcon kind={kind} />
								</span>
								{definition.name}
							</h4>
							<p className="text-xs text-muted-foreground">
								Maximum health{" "}
								{maximumMonsterHealth(kind, difficulty, floorNumber)} ·{" "}
								{definition.areaAttack
									? `blast damage ${scaleEnemyValue(definition.areaAttack.minDamage, difficulty)}–${scaleEnemyValue(definition.areaAttack.maxDamage, difficulty)}`
									: definition.enemySpells
										? `damage varies by spell: ${definition.enemySpells
												.filter((spell) => spell !== "heal")
												.map((spell) => {
													const damage = SPELL_DEFINITIONS[spell];
													return `${damage.name} ${scaleEnemyValue(damage.minimumDamage, difficulty)}–${scaleEnemyValue(damage.maximumDamage, difficulty)}`;
												})
												.join("; ")}`
										: `melee damage ${monsterDamageRange(kind, difficulty, floorNumber).minDamage}–${monsterDamageRange(kind, difficulty, floorNumber).maxDamage}`}
							</p>
							<p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
								{(
									[
										["idle", "Unaware"],
										["pursuing", "Pursuing"],
										["searching", "Searching"],
									] as const
								).map(([state, label]) => {
									const count = observed.filter(
										(actor) =>
											actor.kind === kind &&
											(actor.awareness?.type ?? "idle") === state,
									).length;
									return count ? (
										<span key={state}>
											{state === "pursuing" && definition.stationary
												? "Alert"
												: label}
											: {count}
										</span>
									) : null;
								})}
							</p>
							{definition.alarmRadius && (
								<p className="text-xs text-muted-foreground">
									Preparing alarm:{" "}
									{
										observed.filter(
											(actor) =>
												actor.kind === kind &&
												actor.intent.type === "preparing-alarm",
										).length
									}{" "}
									· Alarm spent:{" "}
									{
										observed.filter(
											(actor) => actor.kind === kind && actor.alarmUsed,
										).length
									}
								</p>
							)}
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
