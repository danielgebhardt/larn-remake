import { type QuestState, questInstruction } from "../../domain/game/Adventure";
import ItemIcon from "../items/ItemIcon";

const QuestStatus = ({
	quest,
	pouch = false,
	activeFloor,
}: {
	quest: QuestState;
	pouch?: boolean;
	activeFloor?: number;
}) => (
	<section
		aria-label={pouch ? "Quest pouch" : "Adventure quest"}
		className={`flex shrink-0 items-center justify-center gap-2 text-xs text-muted-foreground ${pouch ? "rounded-lg border bg-muted/20 p-3" : "pb-3"}`}
	>
		<span className="size-4 shrink-0">
			<ItemIcon kind="cure" />
		</span>
		<div>
			{pouch && (
				<p className="font-medium text-foreground">
					Quest pouch:{" "}
					{quest.cureRecovered
						? "Ember protected — no bag slot used."
						: "Empty — reserved for the last ember."}
				</p>
			)}
			<output aria-label="Quest objective">
				{questInstruction(quest)}
				{quest.cureRecovered && !quest.victory && activeFloor !== undefined
					? activeFloor === 1
						? " Reach the entrance on this floor."
						: ` ${activeFloor - 1} ${activeFloor === 2 ? "floor" : "floors"} to climb.`
					: ""}
			</output>
		</div>
	</section>
);
export default QuestStatus;
