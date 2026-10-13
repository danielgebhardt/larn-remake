import { TriangleAlert } from "lucide-react";
import type { PlayerStats } from "../../domain/game/PlayerStats";

export const isLowHealth = (player: PlayerStats) =>
	player.health > 0 && player.health / player.maxHealth < 0.5;

const HealthDisplay = ({
	player,
	label,
	className,
	compact = false,
}: {
	player: PlayerStats;
	label: string;
	className?: string;
	compact?: boolean;
}) => (
	<output aria-label={label} className={className}>
		<span className={compact ? "sr-only" : undefined}>Health </span>
		<span
			className={
				isLowHealth(player) ? "font-semibold text-destructive" : undefined
			}
		>
			{player.health}
		</span>{" "}
		/ {player.maxHealth}
		{isLowHealth(player) && (
			<span
				className={`${compact ? "mt-1 flex" : "ml-2 inline-flex"} items-center gap-1 rounded-md bg-destructive/15 px-2 py-1 text-xs font-semibold text-destructive`}
			>
				<TriangleAlert aria-hidden="true" className="size-3.5" />
				Low health
			</span>
		)}
	</output>
);
export default HealthDisplay;
