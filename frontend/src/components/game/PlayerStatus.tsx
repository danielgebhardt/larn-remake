import { Coins, Droplets, Heart, Sparkles, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import { maximumMana } from "../../domain/game/Mana";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import {
	levelForExperience,
	type Progression,
} from "../../domain/game/Progression";
import type { Equipment } from "../../domain/items/Equipment";
import HealthDisplay, { isLowHealth } from "./HealthDisplay";
import ManaDisplay from "./ManaDisplay";

const StatusCard = ({
	label,
	icon,
	children,
	warning = false,
}: {
	label: string;
	icon: ReactNode;
	children: ReactNode;
	warning?: boolean;
}) => (
	<div
		className={`min-w-0 rounded-lg border p-2 ${warning ? "border-destructive/40 bg-destructive/10" : "border-border bg-background/60"}`}
	>
		<div
			aria-hidden="true"
			className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground"
		>
			{icon}
			{label}
		</div>
		{children}
	</div>
);
const Reserve = ({
	label,
	value,
	maximum,
	low = false,
	mana = false,
}: {
	label: string;
	value: number;
	maximum: number;
	low?: boolean;
	mana?: boolean;
}) => (
	<div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
		<meter
			aria-label={label}
			min={0}
			max={maximum}
			value={value}
			className="sr-only"
		/>
		<div
			aria-hidden="true"
			className={`h-full rounded-full ${mana ? "bg-violet-500" : low ? "bg-destructive" : "bg-emerald-500"}`}
			style={{
				width: `${Math.max(0, Math.min(100, (value / maximum) * 100))}%`,
			}}
		/>
	</div>
);
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
		className="w-full max-w-md shrink-0 rounded-xl border bg-muted/20 p-2 text-sm tabular-nums"
	>
		<div className="mb-2 flex items-center justify-between gap-3 px-1 text-xs text-muted-foreground">
			<span className="flex items-center gap-1.5">
				<UserRound aria-hidden="true" className="size-4 text-player" />
				Adventurer
			</span>
			<output aria-label="Turn count">Turn {turn}</output>
		</div>
		<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
			<StatusCard
				label="Health"
				icon={<Heart className="size-3.5 text-rose-600 dark:text-rose-400" />}
				warning={isLowHealth(player)}
			>
				<HealthDisplay
					compact
					player={player}
					label="Player health"
					className="block font-semibold"
				/>
				<Reserve
					label="Health reserve"
					value={player.health}
					maximum={player.maxHealth}
					low={isLowHealth(player)}
				/>
			</StatusCard>
			<StatusCard
				label="Mana"
				icon={
					<Droplets className="size-3.5 text-violet-600 dark:text-violet-300" />
				}
			>
				<div className="font-semibold">
					<ManaDisplay
						compact
						equipment={equipment}
						mana={mana}
						progression={progression}
						label="Player mana"
					/>
				</div>
				<Reserve
					label="Mana reserve"
					value={mana}
					maximum={maximumMana(progression, equipment)}
					mana
				/>
			</StatusCard>
			<StatusCard
				label="Gold"
				icon={<Coins className="size-3.5 text-amber-700 dark:text-amber-300" />}
			>
				<output aria-label="Player gold" className="block font-semibold">
					<span className="sr-only">Gold </span>
					{gold}
				</output>
			</StatusCard>
			<StatusCard
				label="Level"
				icon={<Sparkles className="size-3.5 text-primary" />}
			>
				<output aria-label="Player level" className="block font-semibold">
					<span className="sr-only">Level </span>
					{levelForExperience(progression.experience)}
				</output>
			</StatusCard>
		</div>
		{player.health === 0 && (
			<p
				role="alert"
				className="mt-2 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-center text-destructive"
			>
				You died. Start a new dungeon or replay the seed to try again.
			</p>
		)}
	</section>
);
export default PlayerStatus;
