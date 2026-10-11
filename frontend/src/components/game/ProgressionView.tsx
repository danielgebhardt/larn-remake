import { Sparkles } from "lucide-react";
import {
	MAX_PLAYER_LEVEL,
	type Progression,
	progressionProgress,
} from "../../domain/game/Progression";

const ProgressionView = ({ progression }: { progression: Progression }) => {
	const { level, earned, needed, remaining } = progressionProgress(progression);
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
						className="h-2 w-full accent-primary"
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
			<p className="border-t pt-3 text-xs leading-relaxed text-muted-foreground">
				Defeat monsters to earn XP. Each level adds 2 maximum and current
				health, up to level {MAX_PLAYER_LEVEL}.
			</p>
		</section>
	);
};
export default ProgressionView;
