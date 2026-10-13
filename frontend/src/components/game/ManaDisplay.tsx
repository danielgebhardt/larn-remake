import { Droplets } from "lucide-react";
import { maximumMana } from "../../domain/game/Mana";
import type { Progression } from "../../domain/game/Progression";
import type { Equipment } from "../../domain/items/Equipment";

const ManaDisplay = ({
	mana,
	progression,
	equipment,
	label,
	compact = false,
}: {
	mana: number;
	progression: Progression;
	equipment?: Equipment;
	label: string;
	compact?: boolean;
}) => (
	<output
		aria-label={label}
		className="inline-flex items-center gap-1.5 tabular-nums text-violet-700 dark:text-violet-300"
	>
		{!compact && <Droplets aria-hidden="true" className="size-4 shrink-0" />}
		<span className={compact ? "sr-only" : undefined}>Mana </span>
		{mana} / {maximumMana(progression, equipment)}
	</output>
);
export default ManaDisplay;
