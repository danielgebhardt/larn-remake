import { UserRound } from "lucide-react";
import type { PlayerStats } from "../../domain/game/PlayerStats.ts";
import {
	levelForExperience,
	type Progression,
} from "../../domain/game/Progression";
import type { Equipment } from "../../domain/items/Equipment";
import HealthDisplay from "./HealthDisplay";
import ManaDisplay from "./ManaDisplay";

const PlayerStatus = ({
	gold = 0,
	turn,
	mana,
	player,
	progression,
	equipment,
}: {
	gold?: number;
	turn: number;
	mana: number;
	player: PlayerStats;
	progression: Progression;
	equipment?: Equipment;
}) => (
	<section
		aria-label="Player status"
		className="flex shrink-0 flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm tabular-nums"
	>
		<UserRound aria-hidden="true" className="size-6 shrink-0 text-player" />
		<output aria-label="Turn count">Turn {turn}</output>
		<output aria-label="Player level">
			Level {levelForExperience(progression.experience)}
		</output>
		<ManaDisplay
			equipment={equipment}
			mana={mana}
			progression={progression}
			label="Player mana"
		/>
		<output aria-label="Player gold">Gold {gold}</output>
		<HealthDisplay player={player} label="Player health" />
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
