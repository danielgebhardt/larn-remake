import {
	Bomb,
	CircleDashed,
	Droplets,
	Flame,
	Footprints,
	Ghost,
	HeartHandshake,
	HeartPlus,
	HeartPulse,
	Moon,
	Mountain,
	Move,
	Network,
	Orbit,
	Shield,
	Snowflake,
	Sparkles,
	Swords,
	Waves,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	SPELL_SLOT_KEYS,
	SPELL_SLOTS,
	type SpellHotbar,
} from "../../domain/game/SpellHotbar";
import { SPELL_DEFINITIONS, type SpellKind } from "../../domain/game/Spells";

export const SPELL_ICONS = {
	"magic-missile": Sparkles,
	heal: HeartPlus,
	"ember-bolt": Flame,
	"frost-bolt": Snowflake,
	shock: Zap,
	"stone-lance": Mountain,
	"sonic-spear": Waves,
	"drain-life": HeartHandshake,
	web: Network,
	sleep: Moon,
	fear: Ghost,
	"poison-dart": Droplets,
	renewal: HeartPulse,
	fireball: Bomb,
	"frost-nova": CircleDashed,
	blink: Move,
	"teleport-away": Orbit,
	protection: Shield,
	strength: Swords,
	dexterity: Footprints,
};
const SpellHotbarView = ({
	knownSpells,
	slots,
	enabled,
	targeting,
	onActivate,
}: {
	knownSpells: readonly SpellKind[];
	slots: SpellHotbar;
	enabled: boolean;
	targeting?: SpellKind;
	onActivate: (spell: SpellKind) => void;
}) => (
	<section
		aria-label="Spell hotbar"
		className="flex min-w-0 max-w-full flex-wrap items-start gap-1.5 border-l border-border pl-3"
	>
		{slots.map((spell, index) => {
			if (!spell || !knownSpells.includes(spell))
				return (
					<div key={index} className="grid w-12 gap-1 text-center">
						<span
							role="img"
							aria-label={`Spell slot ${index + 1}: empty`}
							className="relative flex size-12 items-center justify-center rounded-lg border border-dashed text-muted-foreground"
						>
							<kbd className="absolute top-0.5 left-1 text-[10px]">
								{SPELL_SLOT_KEYS[SPELL_SLOTS[index]]}
							</kbd>
							—
						</span>
						<span
							aria-hidden="true"
							className="min-h-6 text-[10px] leading-3 text-muted-foreground"
						>
							Empty
						</span>
					</div>
				);
			const definition = SPELL_DEFINITIONS[spell];
			const Icon = SPELL_ICONS[spell];
			const label = `${definition.name}, ${definition.cost} mana`;
			return (
				<div key={spell} className="grid w-12 gap-1 text-center">
					<Button
						variant="outline"
						aria-label={label}
						aria-keyshortcuts={SPELL_SLOT_KEYS[SPELL_SLOTS[index]]}
						title={label}
						aria-pressed={
							definition.mode === "targeted" ? targeting === spell : undefined
						}
						disabled={
							!enabled ||
							(targeting !== undefined && definition.mode === "self")
						}
						onClick={() => onActivate(spell)}
						className="relative size-12 p-2 text-violet-700 dark:text-violet-300"
					>
						<Icon aria-hidden="true" className="size-5" />
						<kbd className="absolute top-0.5 left-1 text-[10px] text-muted-foreground">
							{SPELL_SLOT_KEYS[SPELL_SLOTS[index]]}
						</kbd>
						<span
							aria-hidden="true"
							className="absolute bottom-0.5 right-1 text-[10px]"
						>
							{definition.cost}
						</span>
					</Button>
					<span
						aria-hidden="true"
						className="line-clamp-2 min-h-6 text-[10px] leading-3 text-muted-foreground"
					>
						{definition.name}
					</span>
				</div>
			);
		})}
	</section>
);
export default SpellHotbarView;
