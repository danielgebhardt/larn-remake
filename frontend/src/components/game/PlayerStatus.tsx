import type { PlayerStats } from "../../domain/game/PlayerStats.ts";

const PlayerStatus = ({
	turn,
	player,
}: {
	turn: number;
	player: PlayerStats;
}) => (
	<section
		aria-label="Player status"
		className="flex shrink-0 flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-2 text-sm tabular-nums"
	>
		<output aria-label="Turn count">Turn {turn}</output>
		<output aria-label="Player health">
			Health {player.health} / {player.maxHealth}
		</output>
	</section>
);

export default PlayerStatus;
