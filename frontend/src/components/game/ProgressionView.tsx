import { Sparkles, Sword, Zap } from "lucide-react";
import { deriveAttributes } from "../../domain/game/Attributes";
import {
	HEALTH_PER_LEVEL,
	MAX_PLAYER_LEVEL,
	type Progression,
	progressionProgress,
} from "../../domain/game/Progression";

const ProgressionView = ({ progression }: { progression: Progression }) => {
	const { level, earned, needed, remaining } = progressionProgress(progression);
	const attributes = deriveAttributes(progression);
	return (
		<section
			aria-label="Character progression"
			className="grid content-start gap-3 rounded-lg border bg-muted/20 p-3 md:col-span-2 lg:col-span-1"
		>
			<h3 className="flex items-center gap-2 font-medium">
				<Sparkles aria-hidden="true" className="size-4 text-primary" />
				Progression
			</h3>
			<output
				aria-label="Character level"
				className="text-xl font-semibold tabular-nums"
			>
				Level {level}
			</output>
			<output aria-label="Total experience" className="text-sm tabular-nums">
				{progression.experience} XP total
			</output>
			{level === MAX_PLAYER_LEVEL ? (
				<p className="text-xs text-muted-foreground">Maximum level reached</p>
			) : (
				<>
					<progress
						aria-label="Experience progress"
						value={earned}
						max={needed}
						className="h-2 w-full overflow-hidden rounded-full appearance-none bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary"
					/>
					<p className="text-xs tabular-nums text-muted-foreground">
						{earned} / {needed} XP this level
					</p>
					<output
						aria-label="Experience to next level"
						className="text-xs text-muted-foreground"
					>
						{remaining} XP to level {level + 1}
					</output>
				</>
			)}
			<div className="grid gap-1 border-t pt-3">
				<output
					aria-label="Character Strength"
					className="flex items-center gap-2 font-medium tabular-nums"
				>
					<Sword aria-hidden="true" className="size-4 text-primary" />
					Strength {attributes.strength}
				</output>
				<p className="text-xs text-muted-foreground">
					+{attributes.strengthModifier} melee damage · grows every other level
					starting at 3
				</p>
			</div>
			<div className="grid gap-1 border-t pt-3">
				<output
					aria-label="Character Dexterity"
					className="flex items-center gap-2 font-medium tabular-nums"
				>
					<Zap aria-hidden="true" className="size-4 text-primary" />
					Dexterity {attributes.dexterity}
				</output>
				<p className="text-xs text-muted-foreground">
					+{attributes.dexterityModifier * 5} percentage points to accuracy and
					evasion · grows every other level starting at 2
				</p>
			</div>
			<p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
				Defeat monsters to earn XP. Each level adds {HEALTH_PER_LEVEL} maximum
				and current health, up to level {MAX_PLAYER_LEVEL}.
			</p>
		</section>
	);
};
export default ProgressionView;
