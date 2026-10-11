import { Droplets } from "lucide-react";
import { maximumMana } from "../../domain/game/Mana";
import type { Progression } from "../../domain/game/Progression";

const ManaDisplay = ({
	mana,
	progression,
	label,
}: {
	mana: number;
	progression: Progression;
	label: string;
}) => (
	<output
		aria-label={label}
		className="inline-flex items-center gap-1.5 tabular-nums text-violet-700 dark:text-violet-300"
	>
		<Droplets aria-hidden="true" className="size-4 shrink-0" />
		Mana {mana} / {maximumMana(progression)}
	</output>
);
export default ManaDisplay;
