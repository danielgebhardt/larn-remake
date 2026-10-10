import { Dialog } from "@base-ui/react/dialog";
import { type RefObject, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ActivityHistory } from "../../domain/game/ActivityHistory";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import type { Bag } from "../../domain/items/Bag";
import type { Equipment } from "../../domain/items/Equipment";
import type { FloorItem } from "../../domain/items/FloorItems";
import { formatActivityEvent } from "./ActivityMessages";
import BagContents from "./BagContents";
import CharacterStats from "./CharacterStats";
import EquipmentView from "./EquipmentView";
import FloorItemsView from "./FloorItemsView";

type CharacterDialogProps = {
	player: PlayerStats;
	equipment: Equipment;
	bag: Bag;
	floorItems: readonly FloorItem[];
	turn: number;
	history: ActivityHistory;
	actionError: string;
	onAction: (action: PlayerAction) => void;
	finalFocus?: RefObject<HTMLElement | null>;
};

const CharacterDialog = ({
	player,
	equipment,
	bag,
	floorItems,
	turn,
	history,
	actionError,
	onAction,
	finalFocus,
}: CharacterDialogProps) => {
	const titleRef = useRef<HTMLHeadingElement>(null);
	const events = history.entries.filter((entry) => entry.event.turn === turn);
	return (
		<Dialog.Portal>
			<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-xs" />
			<Dialog.Popup
				initialFocus={titleRef}
				finalFocus={finalFocus}
				className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-y-auto rounded-xl border bg-popover text-sm text-popover-foreground shadow-lg"
			>
				<div className="flex items-start justify-between gap-4 p-4">
					<div>
						<Dialog.Title ref={titleRef} tabIndex={-1} className="outline-none">
							Character
						</Dialog.Title>
						<Dialog.Description>
							Your health, equipment, and carried items.
						</Dialog.Description>
					</div>
					<Dialog.Close render={<Button variant="outline" size="sm" />}>
						Close
					</Dialog.Close>
				</div>
				<div className="grid gap-6 px-4 pb-6">
					<CharacterStats player={player} equipment={equipment} />
					<div className="grid items-start gap-6 md:grid-cols-2">
						<EquipmentView
							equipment={equipment}
							alive={player.health > 0}
							onAction={onAction}
						/>
						<BagContents
							bag={bag}
							canChangeGear={player.health > 0}
							onAction={onAction}
						/>
					</div>
					<FloorItemsView
						items={floorItems}
						alive={player.health > 0}
						onAction={onAction}
					/>
					<p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
						Opening this sheet and inspecting items is free. Each successful
						gear change, pickup, drop, or potion use costs one turn, and
						monsters act afterward.
					</p>
				</div>
				<div className="sticky bottom-0 grid shrink-0 gap-2 border-t bg-popover px-4 py-3">
					{actionError && (
						<p role="alert" className="text-sm text-destructive">
							{actionError}
						</p>
					)}
					{player.health <= 0 && (
						<p role="alert" className="text-sm text-destructive">
							You died. Start a new dungeon or replay a seed to try again.
						</p>
					)}
					<div
						role="status"
						aria-label="Character activity"
						aria-live="polite"
						aria-atomic="true"
						className="grid gap-1 text-xs leading-relaxed"
					>
						<p className="font-medium tabular-nums">
							Turn {turn} · Health {player.health} / {player.maxHealth}
						</p>
						{events.map((entry) => (
							<p key={entry.id} className="text-muted-foreground">
								{formatActivityEvent(entry.event)}
							</p>
						))}
					</div>
				</div>
			</Dialog.Popup>
		</Dialog.Portal>
	);
};

export default CharacterDialog;
