import {
	MAX_PLAYER_LEVEL,
	type Progression,
	progressionProgress,
} from "../../domain/game/Progression";

const ExperienceProgress = ({
	progression,
	compact = false,
	inline = false,
}: {
	progression: Progression;
	compact?: boolean;
	inline?: boolean;
}) => {
	const { level, earned, needed, remaining } = progressionProgress(progression);
	const textStyle = compact ? "text-[14px] leading-tight" : "text-xs";
	return (
		<div
			className={`grid gap-1 tabular-nums text-muted-foreground ${inline && level !== MAX_PLAYER_LEVEL ? "grid-cols-[minmax(0,1fr)_auto] items-center gap-2" : ""}`}
		>
			{level === MAX_PLAYER_LEVEL ? (
				<>
					<p className={textStyle}>Maximum level reached</p>
					{compact && (
						<output aria-label="Player experience" className={textStyle}>
							{progression.experience} XP total
						</output>
					)}
				</>
			) : (
				<>
					<progress
						aria-label={
							compact ? "Player experience progress" : "Experience progress"
						}
						aria-valuetext={`${earned} of ${needed} XP this level; ${remaining} XP to level ${level + 1}`}
						value={earned}
						max={needed}
						className="h-3 w-full overflow-hidden rounded-full border border-amber-600/70 appearance-none bg-amber-950/10 dark:border-amber-400/60 dark:bg-amber-950/35 [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-amber-500 [&::-moz-progress-bar]:bg-amber-500"
					/>
					<output
						aria-label={compact ? "Player experience" : undefined}
						className={textStyle}
					>
						{earned} / {needed} XP
						{!compact && <span> this level</span>}
					</output>
					{!compact && (
						<output aria-label="Experience to next level" className="text-xs">
							{remaining} XP to level {level + 1}
						</output>
					)}
				</>
			)}
		</div>
	);
};
export default ExperienceProgress;
