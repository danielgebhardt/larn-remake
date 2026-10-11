import { Dialog } from "@base-ui/react/dialog";
import { type RefObject, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ActivityHistory } from "../../domain/game/ActivityHistory";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import type { FloorItem, FloorItemAction } from "../../domain/items/FloorItems";
import { formatActivityEvent } from "./ActivityMessages";
import FloorItemsView from "./FloorItemsView";

const PickupDialog = ({
	open,
	onOpenChange,
	items,
	player,
	turn,
	history,
	error,
	onAction,
	mapRef,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	items: readonly FloorItem[];
	player: PlayerStats;
	turn: number;
	history: ActivityHistory;
	error: string;
	onAction: (action: FloorItemAction) => void;
	mapRef: RefObject<HTMLElement | null>;
}) => {
	const titleRef = useRef<HTMLHeadingElement>(null);
	const [requestedPage, setPage] = useState(0);
	const pageCount = Math.max(1, Math.ceil(items.length / 9));
	const page = Math.min(requestedPage, pageCount - 1);
	const displayedItems = items.slice(page * 9, (page + 1) * 9);
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-xs" />
				<Dialog.Popup
					onKeyDown={(event) => {
						if (
							!open ||
							event.ctrlKey ||
							event.metaKey ||
							event.altKey ||
							event.shiftKey
						)
							return;
						if (
							event.target instanceof HTMLElement &&
							event.target.closest(
								'input, textarea, select, [contenteditable="true"]',
							)
						)
							return;
						if (event.key === "PageDown" || event.key === "PageUp") {
							event.preventDefault();
							event.stopPropagation();
							if (!event.repeat)
								setPage(
									Math.max(
										0,
										Math.min(
											pageCount - 1,
											page + (event.key === "PageDown" ? 1 : -1),
										),
									),
								);
							return;
						}
						if (!/^[1-9]$/.test(event.key)) return;
						event.preventDefault();
						event.stopPropagation();
						const choice = displayedItems[Number(event.key) - 1];
						if (!event.repeat && player.health > 0 && choice) {
							onAction({ type: "pickup", itemId: choice.item.id });
							titleRef.current?.focus({ preventScroll: true });
						}
					}}
					initialFocus={titleRef}
					finalFocus={mapRef}
					className="fixed top-1/2 left-1/2 z-50 grid max-h-[85dvh] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 gap-4 overflow-y-auto rounded-lg border bg-popover p-4 text-sm text-popover-foreground shadow-lg"
				>
					<Dialog.Title
						ref={titleRef}
						tabIndex={-1}
						className="font-medium outline-none"
					>
						Pick up items
					</Dialog.Title>
					<Dialog.Description className="text-xs leading-relaxed text-muted-foreground">
						Press 1–9 or click to choose an item on this tile. Each pickup uses
						one turn, then monsters act. Escape cancels without using a turn.
					</Dialog.Description>
					<FloorItemsView
						items={displayedItems}
						numbered
						alive={player.health > 0}
						onAction={onAction}
					/>
					{pageCount > 1 && (
						<div className="grid gap-2">
							<p className="text-xs text-muted-foreground">
								Page {page + 1} of {pageCount} · Page Up / Page Down
							</p>
							<div className="flex justify-between gap-2">
								<Button
									variant="outline"
									disabled={page === 0}
									onClick={() => setPage(page - 1)}
								>
									Previous page
								</Button>
								<Button
									variant="outline"
									disabled={page === pageCount - 1}
									onClick={() => setPage(page + 1)}
								>
									Next page
								</Button>
							</div>
						</div>
					)}
					{error && (
						<p role="alert" className="text-sm text-destructive">
							{error}
						</p>
					)}
					<div
						role="status"
						aria-label="Pickup activity"
						aria-live="polite"
						aria-atomic="true"
						className="grid gap-1 border-t pt-3 text-xs leading-relaxed"
					>
						<p className="font-medium tabular-nums">
							Turn {turn} · Health {player.health} / {player.maxHealth}
						</p>
						{history.entries
							.filter((entry) => entry.event.turn === turn)
							.map((entry) => (
								<p key={entry.id} className="text-muted-foreground">
									{formatActivityEvent(entry.event)}
								</p>
							))}
					</div>
					<Dialog.Close render={<Button variant="outline" />}>
						Close
					</Dialog.Close>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
export default PickupDialog;
