import { Flame, HeartPlus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SPELL_DEFINITIONS, type SpellKind } from "../../domain/game/Spells";

export const SPELL_ICONS = {
	"magic-missile": Sparkles,
	heal: HeartPlus,
	"ember-bolt": Flame,
};
const SpellHotbarView = ({
	knownSpells,
	enabled,
	targeting,
	onActivate,
}: {
	knownSpells: readonly SpellKind[];
	enabled: boolean;
	targeting?: SpellKind;
	onActivate: (spell: SpellKind) => void;
}) => (
	<section
		aria-label="Spell hotbar"
		className="flex items-center gap-1.5 border-l border-border pl-3"
	>
		{knownSpells.map((spell) => {
			const definition = SPELL_DEFINITIONS[spell];
			const Icon = SPELL_ICONS[spell];
			const label = `${definition.name}, ${definition.cost} mana`;
			return (
				<Button
					key={spell}
					variant="outline"
					aria-label={label}
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
						{definition.mode === "self" ? "H" : "Z"}
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
