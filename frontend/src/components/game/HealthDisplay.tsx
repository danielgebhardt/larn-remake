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
	</output>
);
export default HealthDisplay;
