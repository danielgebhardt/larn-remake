import { MANA_RECOVERY_INTERVAL } from "../../domain/game/Mana";
import type { Progression } from "../../domain/game/Progression";
import {
	SPELL_DEFINITIONS,
	type SpellKind,
	spellPotency,
} from "../../domain/game/Spells";
import ManaDisplay from "./ManaDisplay";
import { SPELL_ICONS } from "./SpellHotbarView";

const SpellsView = ({
	knownSpells,
	mana,
	progression,
}: {
	knownSpells: readonly SpellKind[];
	mana: number;
	progression: Progression;
}) => {
	const potency = spellPotency(progression);
	return (
		<div className="grid content-start gap-4 p-4">
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
				<ManaDisplay label="Spell mana" mana={mana} progression={progression} />
				<p className="text-xs text-muted-foreground">
					Recover 1 mana every {MANA_RECOVERY_INTERVAL} successful turns, after
					monsters act.
				</p>
			</div>
			<div className="grid gap-4 sm:grid-cols-2">
				{knownSpells.map((spell) => {
					const definition = SPELL_DEFINITIONS[spell];
					const Icon = SPELL_ICONS[spell];
					return (
						<section
							key={spell}
							aria-label={definition.name}
							className="grid content-start gap-3 rounded-lg border bg-muted/20 p-4"
						>
							<h3 className="flex items-center gap-2 font-semibold">
								<Icon
									aria-hidden="true"
									className="size-5 text-violet-700 dark:text-violet-300"
								/>
								{definition.name}
							</h3>
							<p className="font-medium tabular-nums">
								{definition.mode === "self"
									? `Heal up to ${potency.healing} health · ${definition.cost} mana`
									: `Damage ${potency.minimumDamage}–${potency.maximumDamage} · ${definition.cost} mana`}
							</p>
							<p className="text-sm text-muted-foreground">
								{definition.description}
							</p>
							<p className="text-xs text-muted-foreground">
								{definition.mode === "self"
									? "Self-cast: H or click its hotbar button after closing Character."
									: `Targeted: Z or click its hotbar button after closing Character. Range ${definition.range} (horizontal and vertical distance combined), clear wall sight, and currently visible targets. Arrows or WASD cast at the nearest eligible monster straight in that direction; Enter or a target click casts at the highlighted target. Escape or Z cancels for free.`}
							</p>
						</section>
					);
				})}
			</div>
			{knownSpells.length === 0 && <p>No spells learned yet.</p>}
			<p className="text-xs text-muted-foreground">
				A successful cast uses one turn before monsters act. Unaffordable or
				invalid casts are free. Intelligence improves spell potency and mana
				capacity; levels do not teach spells. Future spells will be learned from
				found spellbooks.
			</p>
		</div>
	);
};
export default SpellsView;
