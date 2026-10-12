import { Button } from "@/components/ui/button";
import { MANA_RECOVERY_INTERVAL } from "../../domain/game/Mana";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { Progression } from "../../domain/game/Progression";
import { SPELL_SLOTS, type SpellHotbar } from "../../domain/game/SpellHotbar";
import {
	SPELL_DEFINITIONS,
	type SpellKind,
	spellPotency,
} from "../../domain/game/Spells";
import { EFFECT_DEFINITIONS } from "../../domain/game/TimedEffects";
import type { Equipment } from "../../domain/items/Equipment";
import ManaDisplay from "./ManaDisplay";
import { SPELL_ICONS } from "./SpellHotbarView";

const SpellsView = ({
	knownSpells,
	slots,
	onAction,
	assignmentsEnabled,
	mana,
	progression,
	equipment,
}: {
	knownSpells: readonly SpellKind[];
	slots: SpellHotbar;
	onAction: (action: PlayerAction) => void;
	assignmentsEnabled: boolean;
	mana: number;
	progression: Progression;
	equipment?: Equipment;
}) => {
	return (
		<div className="grid content-start gap-4 p-4">
			<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/20 p-3">
				<ManaDisplay
					equipment={equipment}
					label="Spell mana"
					mana={mana}
					progression={progression}
				/>
				<p className="text-xs text-muted-foreground">
					Recover 1 mana every {MANA_RECOVERY_INTERVAL} successful turns, after
					monsters act.
				</p>
			</div>
			<section aria-label="Spell shortcuts" className="rounded-lg border p-3">
				<p className="mb-2 text-xs text-muted-foreground">
					Four spell shortcuts use keys 5–8. Assign below; changing shortcuts is
					free. Z still targets Magic Missile and H casts Heal.
				</p>
				<div className="flex flex-wrap gap-2">
					{SPELL_SLOTS.map((slot) => (
						<Button
							key={slot}
							size="sm"
							variant="outline"
							disabled={!assignmentsEnabled || slots[slot - 1] === null}
							aria-label={`Clear spell slot ${slot}`}
							onClick={() =>
								onAction({ type: "assign-spell", slot, spell: null })
							}
						>
							{slot + 4}:{" "}
							{slots[slot - 1]
								? SPELL_DEFINITIONS[slots[slot - 1] as SpellKind].name
								: "Empty"}{" "}
							×
						</Button>
					))}
				</div>
			</section>
			<div className="grid gap-4 sm:grid-cols-2">
				{knownSpells.map((spell) => {
					const definition = SPELL_DEFINITIONS[spell];
					const potency = spellPotency(progression, definition, equipment);
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
								{potency.effect === "heal"
									? `Heal up to ${potency.healing} health · ${definition.cost} mana`
									: potency.effect === "condition"
										? `${EFFECT_DEFINITIONS[potency.condition].name} · ${EFFECT_DEFINITIONS[potency.condition].duration} active phases · ${definition.cost} mana`
										: potency.effect === "reposition"
											? `Reposition · ${definition.cost} mana`
											: `Damage ${potency.minimumDamage}–${potency.maximumDamage} · ${definition.cost} mana`}
							</p>
							<fieldset
								aria-label={`Assign ${definition.name} shortcut`}
								className="flex gap-2"
							>
								{SPELL_SLOTS.map((slot) => (
									<Button
										key={slot}
										size="sm"
										variant="outline"
										disabled={!assignmentsEnabled}
										aria-pressed={slots[slot - 1] === spell}
										aria-label={`Assign ${definition.name} to spell slot ${slot}`}
										onClick={() =>
											onAction({ type: "assign-spell", slot, spell })
										}
									>
										{slot + 4}
									</Button>
								))}
							</fieldset>
							<p className="text-sm text-muted-foreground">
								{definition.description}
							</p>
							<p className="text-xs text-muted-foreground">
								{definition.mode === "self"
									? spell === "heal"
										? "Self-cast: H or click its hotbar button after closing Character."
										: "Self-cast: use its assigned key or click its hotbar button after closing Character."
									: `Targeted: use its assigned key or click its hotbar button after closing Character. Z always selects Magic Missile. Range ${definition.range} (horizontal and vertical distance combined), clear wall sight, and currently visible targets. Arrows or WASD cast at the nearest eligible monster straight in that direction; Enter or a target click casts at the highlighted target. Escape or Z cancels for free.`}
							</p>
						</section>
					);
				})}
			</div>
			{knownSpells.length === 0 && <p>No spells learned yet.</p>}
			<p className="text-xs text-muted-foreground">
				A successful cast uses one turn before monsters act. Unaffordable or
				invalid casts are free. Intelligence improves spell potency and mana
				capacity; levels do not teach spells. Learn more spells from found
				spellbooks.
			</p>
		</div>
	);
};
export default SpellsView;
