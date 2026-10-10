import { UserRound } from "lucide-react";
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
		className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm tabular-nums"
	>
		<UserRound aria-hidden="true" className="size-6 shrink-0 text-player" />
		<output aria-label="Turn count">Turn {turn}</output>
		<output aria-label="Player health">
			Health {player.health} / {player.maxHealth}
		</output>
		{player.health === 0 && (
			<p
				role="alert"
				className="w-full rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-destructive"
			>
				You died. Start a new dungeon or replay the seed to try again.
			</p>
		)}
	</section>
);

export default PlayerStatus;
