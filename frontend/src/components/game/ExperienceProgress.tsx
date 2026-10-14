import {
	MAX_PLAYER_LEVEL,
	type Progression,
	progressionProgress,
} from "../../domain/game/Progression";

const ExperienceProgress = ({
	progression,
	compact = false,
}: {
	progression: Progression;
	compact?: boolean;
}) => {
	const { level, earned, needed, remaining } = progressionProgress(progression);
	const textStyle = compact ? "text-[10px] leading-tight" : "text-xs";
	return (
		<div className="grid gap-1 tabular-nums text-muted-foreground">
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
						className={`${compact ? "h-1.5" : "h-2"} w-full overflow-hidden rounded-full appearance-none bg-muted [&::-webkit-progress-bar]:bg-muted [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-moz-progress-bar]:bg-primary`}
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
