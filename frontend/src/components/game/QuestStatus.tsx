import { type QuestState, questInstruction } from "../../domain/game/Adventure";
import ItemIcon from "../items/ItemIcon";
import EmberEmblem from "./EmberEmblem";

type QuestStatusProps = {
	quest: QuestState;
	pouch?: boolean;
	activeFloor?: number;
};

const QuestStatus = ({
	quest,
	pouch = false,
	activeFloor,
}: QuestStatusProps) => {
	const instruction = questInstruction(quest);

	const returnInstruction =
		quest.cureRecovered && !quest.victory && activeFloor !== undefined
			? activeFloor === 1
				? " Reach the entrance on this floor."
				: ` ${activeFloor - 1} ${activeFloor === 2 ? "floor" : "floors"} to climb.`
			: "";

	if (pouch) {
		return (
			<section
				aria-label="Quest pouch"
				className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 p-3"
			>
				<span aria-hidden="true" className="size-5 shrink-0">
					<ItemIcon kind="cure" />
				</span>

				<div className="min-w-0 space-y-1 text-sm">
					<p className="font-serif font-semibold text-foreground">
						Quest Pouch
					</p>

					<p className="text-xs text-muted-foreground">
						{quest.cureRecovered
							? "Ember protected — no bag slot used."
							: "Empty — reserved for the last ember."}
					</p>

					<output
						aria-label="Quest objective"
						className="block text-xs text-muted-foreground"
					>
						{instruction}
						{returnInstruction}
					</output>
				</div>
			</section>
		);
	}

	return (
		<section
			aria-label="Adventure quest"
			className="ember-panel ember-objective flex min-w-0 items-center gap-1 border px-1 py-1"
		>
			<EmberEmblem className="-ml-1 size-14" />

			<div className="flex min-w-0 flex-col gap-0.5">
				<div className="flex items-center gap-1.5">
					<span className="font-serif text-sm font-semibold tracking-wide text-amber-900 dark:text-amber-300">
						Objective
					</span>
				</div>

				<output
					aria-label="Quest objective"
					className="text-sm leading-4 text-foreground/85"
				>
					{instruction}
					{returnInstruction}
				</output>
			</div>
		</section>
	);
};

export default QuestStatus;
