import {
	Flame,
	HeartHandshake,
	HeartPlus,
	Mountain,
	Snowflake,
	Sparkles,
	Waves,
	Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SpellHotbar } from "../../domain/game/SpellHotbar";
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
		className="flex items-center gap-1.5 border-l border-border pl-3"
	>
		{slots.map((spell, index) => {
			if (!spell || !knownSpells.includes(spell))
				return (
					<span
						key={index}
						role="img"
						aria-label={`Spell slot ${index + 1}: empty`}
						className="relative flex size-12 items-center justify-center rounded-lg border border-dashed text-muted-foreground"
					>
						<kbd className="absolute top-0.5 left-1 text-[10px]">
							{index + 5}
						</kbd>
						—
					</span>
				);
			const definition = SPELL_DEFINITIONS[spell];
			const Icon = SPELL_ICONS[spell];
			const label = `${definition.name}, ${definition.cost} mana`;
			return (
				<Button
					key={spell}
					variant="outline"
					aria-label={label}
					aria-keyshortcuts={String(index + 5)}
					title={label}
					aria-pressed={
						definition.mode === "targeted" ? targeting === spell : undefined
					}
					disabled={
						!enabled || (targeting !== undefined && definition.mode === "self")
					}
					onClick={() => onActivate(spell)}
					className="relative size-12 p-2 text-violet-700 dark:text-violet-300"
				>
					<Icon aria-hidden="true" className="size-5" />
					<kbd className="absolute top-0.5 left-1 text-[10px] text-muted-foreground">
						{index + 5}
					</kbd>
					<span
						aria-hidden="true"
						className="absolute bottom-0.5 right-1 text-[10px]"
					>
						{definition.cost}
					</span>
				</Button>
			);
		})}
	</section>
);
export default SpellHotbarView;
