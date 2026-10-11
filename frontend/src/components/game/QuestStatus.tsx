import { Gem } from "lucide-react";
import { type QuestState, questInstruction } from "../../domain/game/Adventure";

const QuestStatus = ({
	quest,
	pouch = false,
}: {
	quest: QuestState;
	pouch?: boolean;
}) => (
	<section
		aria-label={pouch ? "Quest pouch" : "Adventure quest"}
		className={`flex shrink-0 items-center justify-center gap-2 text-xs text-muted-foreground ${pouch ? "rounded-lg border bg-muted/20 p-3" : "pb-3"}`}
	>
		<Gem aria-hidden="true" className="size-4 shrink-0 text-item-cure" />
		<div>
			{pouch && (
				<p className="font-medium text-foreground">
					Quest pouch:{" "}
					{quest.cureRecovered
						? "Cure protected — no bag slot used."
						: "Empty — reserved for the cure."}
				</p>
			)}
			<output aria-label="Quest objective">{questInstruction(quest)}</output>
		</div>
	</section>
);
export default QuestStatus;
