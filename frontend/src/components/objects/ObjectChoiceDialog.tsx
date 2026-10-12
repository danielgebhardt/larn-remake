import { Dialog } from "@base-ui/react/dialog";
import { type RefObject, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
	type DungeonObject,
	OBJECT_DEFINITIONS,
} from "../../domain/objects/DungeonObject";
import { objectChoices } from "../../domain/objects/ObjectChoices";
import type { InteractAction } from "../../domain/objects/ObjectInteraction";

const ObjectChoiceDialog = ({
	object,
	onClose,
	onChoose,
	mapRef,
}: {
	object: DungeonObject | null;
	onClose: () => void;
	onChoose: (action: InteractAction) => void;
	mapRef: RefObject<HTMLElement | null>;
}) => {
	const titleRef = useRef<HTMLHeadingElement>(null);
	const choices = object ? objectChoices(object) : [];
	const choose = (index: number) => {
		if (!object || !choices[index]) return;
		onChoose({
			type: "interact",
			objectId: object.id,
			choice: choices[index].value,
		});
		onClose();
	};
	return (
		<Dialog.Root
			open={object !== null}
			onOpenChange={(open) => {
				if (!open) onClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 supports-backdrop-filter:backdrop-blur-xs" />
				<Dialog.Popup
					initialFocus={titleRef}
					finalFocus={mapRef}
					className="fixed top-1/2 left-1/2 z-50 grid w-[min(32rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 gap-4 rounded-xl border bg-card p-6 shadow-xl"
					onKeyDown={(event) => {
						if (
							event.repeat ||
							event.ctrlKey ||
							event.metaKey ||
							event.altKey ||
							event.shiftKey
						)
							return;
						const index = Number(event.key) - 1;
						if (
							Number.isInteger(index) &&
							index >= 0 &&
							index < choices.length
						) {
							event.preventDefault();
							event.stopPropagation();
							choose(index);
						}
					}}
				>
					<Dialog.Title
						ref={titleRef}
						tabIndex={-1}
						className="text-lg font-semibold"
					>
						{object ? OBJECT_DEFINITIONS[object.kind].name : "Object"}
					</Dialog.Title>
					<Dialog.Description className="text-sm text-muted-foreground">
						Choose an interaction. Inspection and canceling use no turn.
					</Dialog.Description>
					{choices.map((choice, index) => (
						<Button
							key={choice.value}
							variant="outline"
							className="h-auto justify-start gap-3 whitespace-normal p-3 text-left"
							onClick={() => choose(index)}
						>
							<kbd className="rounded border px-2 py-1">{index + 1}</kbd>
							<span>
								<span className="block font-medium">{choice.label}</span>
								<span className="block text-xs font-normal text-muted-foreground">
									{choice.description}
								</span>
							</span>
						</Button>
					))}
					<Dialog.Close render={<Button variant="ghost" />}>
						Cancel
					</Dialog.Close>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
export default ObjectChoiceDialog;
