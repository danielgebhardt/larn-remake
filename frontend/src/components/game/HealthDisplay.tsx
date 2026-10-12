import { TriangleAlert } from "lucide-react";
import type { PlayerStats } from "../../domain/game/PlayerStats";

export const isLowHealth = (player: PlayerStats) =>
	player.health > 0 && player.health / player.maxHealth < 0.5;

const HealthDisplay = ({
	player,
	label,
	className,
}: {
	player: PlayerStats;
	label: string;
	className?: string;
}) => (
	<output aria-label={label} className={className}>
		Health{" "}
		<span
			className={
				isLowHealth(player) ? "font-semibold text-destructive" : undefined
			}
		>
			{player.health}
		</span>{" "}
		/ {player.maxHealth}
		{isLowHealth(player) && (
			<span className="ml-2 inline-flex items-center gap-1 rounded-md bg-destructive/15 px-2 py-1 text-xs font-semibold text-destructive">
				<TriangleAlert aria-hidden="true" className="size-3.5" />
				Low health
			</span>
		)}
	</output>
);
export default HealthDisplay;
