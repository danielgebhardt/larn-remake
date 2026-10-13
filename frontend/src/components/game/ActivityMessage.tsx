import {
	Brain,
	Skull,
	Sparkles,
	Sword,
	TriangleAlert,
	Trophy,
	Zap,
} from "lucide-react";
import type { ActivityEvent } from "../../domain/game/ActivityHistory";
import { formatActivityEvent } from "./ActivityMessages";

const ActivityMessage = ({ event }: { event: ActivityEvent }) => {
	const text = formatActivityEvent(event);
	const milestone =
		event.type === "level-gained" ||
		event.type === "quest-completed" ||
		event.type === "escape-started";
	const danger = event.type === "player-died";
	const growth = event.type === "attribute-gained";
	if (event.type === "monster-prepared")
		return (
			<span className="my-0.5 flex items-start gap-2 rounded-r border-l-2 border-map-threat/50 bg-map-threat/10 px-2 py-1 font-semibold text-map-threat">
				<TriangleAlert
					aria-hidden="true"
					className="mt-0.5 size-3.5 shrink-0"
				/>
				{text}
			</span>
		);
	if (!milestone && !danger && !growth) return <>{text}</>;
	const Icon =
		event.type === "level-gained"
			? Sparkles
			: event.type === "quest-completed"
				? Trophy
				: event.type === "attribute-gained"
					? event.attribute === "Strength"
						? Sword
						: event.attribute === "Intelligence"
							? Brain
							: Zap
					: Skull;
	const className = danger
		? "border-destructive/50 bg-destructive/10 font-semibold text-destructive"
		: milestone
			? "border-primary/50 bg-primary/10 font-semibold text-primary"
			: "border-primary/25 font-medium text-primary";
	return (
		<span
			className={`my-0.5 flex items-start gap-2 rounded-r border-l-2 px-2 py-1 ${className}`}
		>
			<Icon aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
			{text}
		</span>
	);
};
export default ActivityMessage;
