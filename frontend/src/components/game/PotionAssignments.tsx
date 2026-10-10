import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { Bag } from "../../domain/items/Bag";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import {
	HOTBAR_SLOTS,
	hotbarSlotContents,
	type PotionHotbar,
} from "../../domain/items/PotionHotbar";

const PotionAssignments = ({
	bag,
	potionHotbar,
	onAction,
}: {
	bag: Bag;
	potionHotbar: PotionHotbar;
	onAction: (action: PlayerAction) => void;
}) => {
	const headingRef = useRef<HTMLHeadingElement>(null);
	return (
		<section aria-labelledby="potion-shortcuts-title" className="grid gap-3">
			<h3
				id="potion-shortcuts-title"
				ref={headingRef}
				tabIndex={-1}
				className="font-medium outline-none"
			>
				Potion shortcuts
			</h3>
			<p className="text-xs text-muted-foreground">
				Select a carried potion to assign it. Assignments are free and bottles
				stay in your bag.
			</p>
			<div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
				{HOTBAR_SLOTS.map((slot) => {
					const { kind, count } = hotbarSlotContents(
						{ bag, potionHotbar },
						slot,
					);
					return (
						<div
							key={slot}
							className="grid content-start gap-2 rounded-lg border bg-muted/20 p-3"
						>
							<p className="text-xs font-medium text-muted-foreground">
								Slot {slot}
							</p>
							<output
								aria-label={`Potion slot ${slot} assignment`}
								className="text-xs leading-relaxed"
							>
								{kind
									? `${ITEM_DEFINITIONS[kind].name} · ${count} carried`
									: "Empty"}
							</output>
							{kind && (
								<Button
									type="button"
									variant="outline"
									size="sm"
									aria-label={`Clear potion slot ${slot}`}
									onClick={() => {
										onAction({ type: "clear-hotbar", slot });
										headingRef.current?.focus({ preventScroll: true });
									}}
								>
									Clear
								</Button>
							)}
						</div>
					);
				})}
			</div>
		</section>
	);
};
export default PotionAssignments;
