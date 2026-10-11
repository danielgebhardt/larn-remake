import { Dialog } from "@base-ui/react/dialog";
import { Tabs } from "@base-ui/react/tabs";
import { type RefObject, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ActivityHistory } from "../../domain/game/ActivityHistory";
import type { QuestState } from "../../domain/game/Adventure";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import type { Progression } from "../../domain/game/Progression";
import type { SpellKind } from "../../domain/game/Spells";
import type { Bag } from "../../domain/items/Bag";
import type { Equipment, EquipmentSlot } from "../../domain/items/Equipment";
import type { FloorItem } from "../../domain/items/FloorItems";
import type { PotionHotbar } from "../../domain/items/PotionHotbar";
import { formatActivityEvent } from "./ActivityMessages";
import BagContents from "./BagContents";
import { isCharacterShortcut } from "./CharacterShortcut";
import CharacterStats from "./CharacterStats";
import EquipmentView from "./EquipmentView";
import FloorItemsView from "./FloorItemsView";
import ItemDetails from "./ItemDetails";
import PotionAssignments from "./PotionAssignments";
import ProgressionView from "./ProgressionView";
import QuestStatus from "./QuestStatus";
import SpellsView from "./SpellsView";

type CharacterDialogProps = {
	player: PlayerStats;
	mana: number;
	knownSpells: readonly SpellKind[];
	progression: Progression;
	won?: boolean;
	quest: QuestState;
	equipment: Equipment;
	bag: Bag;
	potionHotbar: PotionHotbar;
	floorItems: readonly FloorItem[];
	turn: number;
	history: ActivityHistory;
	actionError: string;
	onAction: (action: PlayerAction) => void;
	onCloseRequested: () => void;
	finalFocus?: RefObject<HTMLElement | null>;
};

const CharacterDialog = ({
	player,
	mana,
	knownSpells,
	progression,
	won = false,
	quest,
	equipment,
	bag,
	potionHotbar,
	floorItems,
	turn,
	history,
	actionError,
	onAction,
	onCloseRequested,
	finalFocus,
}: CharacterDialogProps) => {
	const [selection, setSelection] = useState<
		| { source: "bag"; id: string }
		| { source: "equipment"; slot: EquipmentSlot; id: string }
		| null
	>(null);
	const bagHeadingRef = useRef<HTMLHeadingElement>(null);
	const equipmentHeadingRef = useRef<HTMLHeadingElement>(null);
	const selected =
		selection?.source === "bag"
			? bag.items.find((item) => item.id === selection.id)
			: selection?.source === "equipment" &&
					equipment[selection.slot]?.id === selection.id
				? equipment[selection.slot]
				: null;
	const detailsRef = useRef<HTMLDivElement>(null);
	const selectedId = selected?.id;
	useLayoutEffect(() => {
		if (selectedId) detailsRef.current?.scrollIntoView?.({ block: "nearest" });
	}, [selectedId]);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const events = history.entries.filter((entry) => entry.event.turn === turn);
	return (
		<Dialog.Portal>
			<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 supports-backdrop-filter:backdrop-blur-xs" />
			<Dialog.Popup
				initialFocus={titleRef}
				finalFocus={finalFocus}
				onKeyDown={(event) => {
					if (!isCharacterShortcut(event.key)) return;
					if (
						event.ctrlKey ||
						event.metaKey ||
						event.altKey ||
						event.target instanceof HTMLInputElement ||
						event.target instanceof HTMLTextAreaElement ||
						(event.target instanceof HTMLElement &&
							event.target.isContentEditable)
					)
						return;
					event.preventDefault();
					event.stopPropagation();
					if (!event.repeat) onCloseRequested();
				}}
				className="fixed top-1/2 left-1/2 z-50 flex h-[min(52rem,calc(100dvh-2rem))] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-6xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border bg-popover text-sm text-popover-foreground shadow-lg"
			>
				<div className="flex shrink-0 items-start justify-between gap-4 border-b p-4">
					<div>
						<Dialog.Title ref={titleRef} tabIndex={-1} className="outline-none">
							Character
						</Dialog.Title>
						<Dialog.Description>
							Your progression, equipment, carried items, and known spells.
						</Dialog.Description>
					</div>
					<Dialog.Close render={<Button variant="outline" size="sm" />}>
						Close
					</Dialog.Close>
				</div>
				<Tabs.Root
					defaultValue="character"
					className="flex min-h-0 flex-1 flex-col"
				>
					<Tabs.List
						activateOnFocus
						aria-label="Character sections"
						className="flex shrink-0 gap-1 border-b px-4 pt-2"
					>
						<Tabs.Tab
							value="character"
							className="rounded-t-md border-b-2 border-transparent px-4 py-2 font-medium text-muted-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary data-active:border-primary data-active:text-foreground"
						>
							Character
						</Tabs.Tab>
						<Tabs.Tab
							value="spells"
							className="rounded-t-md border-b-2 border-transparent px-4 py-2 font-medium text-muted-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary data-active:border-primary data-active:text-foreground"
						>
							Spells
						</Tabs.Tab>
					</Tabs.List>
					<Tabs.Panel
						value="character"
						className="min-h-0 flex-1 overflow-y-auto"
					>
						<div className="shrink-0 border-b px-4 py-3">
							<CharacterStats
								player={player}
								equipment={equipment}
								progression={progression}
							/>
						</div>
						<div className="min-h-0 overflow-y-auto p-4">
							<div className="grid items-start gap-5 md:grid-cols-2 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,1fr)_minmax(0,1.25fr)]">
								<ProgressionView progression={progression} mana={mana} />
								<div className="grid content-start gap-4">
									<EquipmentView
										equipment={equipment}
										selectedId={
											selection?.source === "equipment"
												? (selected?.id ?? null)
												: null
										}
										headingRef={equipmentHeadingRef}
										onSelect={(slot) => {
											const item = equipment[slot];
											setSelection(
												item
													? { source: "equipment", slot, id: item.id }
													: null,
											);
										}}
									/>
									<PotionAssignments
										enabled={!won}
										bag={bag}
										potionHotbar={potionHotbar}
										onAction={onAction}
									/>
								</div>
								<div className="grid content-start gap-4">
									<BagContents
										bag={bag}
										equipment={equipment}
										selectedId={
											selection?.source === "bag"
												? (selected?.id ?? null)
												: null
										}
										headingRef={bagHeadingRef}
										onSelect={(id) => setSelection({ source: "bag", id })}
									>
										{selected && selection ? (
											<div ref={detailsRef}>
												<ItemDetails
													item={selected}
													equipment={equipment}
													potionHotbar={potionHotbar}
													assignmentsEnabled={!won}
													equippedSlot={
														selection.source === "equipment"
															? selection.slot
															: undefined
													}
													alive={player.health > 0 && !won}
													onAction={onAction}
													afterAction={() => {
														const heading =
															selection.source === "bag"
																? bagHeadingRef
																: equipmentHeadingRef;
														heading.current?.focus({ preventScroll: true });
													}}
												/>
											</div>
										) : (
											<p className="text-xs text-muted-foreground">
												Select an item to see its details.
											</p>
										)}
									</BagContents>
									<QuestStatus quest={quest} pouch />
									<FloorItemsView
										items={floorItems}
										alive={player.health > 0 && !won}
										onAction={onAction}
									/>
									<p className="rounded-lg border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
										Opening this dialog and inspecting items is free. Each
										successful gear change, pickup, drop, or potion use costs
										one turn, and monsters act afterward.
									</p>
								</div>
							</div>
						</div>
					</Tabs.Panel>
					<Tabs.Panel value="spells" className="min-h-0 flex-1 overflow-y-auto">
						<SpellsView
							knownSpells={knownSpells}
							mana={mana}
							progression={progression}
						/>
					</Tabs.Panel>
				</Tabs.Root>
				<div className="grid max-h-36 shrink-0 overflow-y-auto gap-2 border-t bg-popover px-4 py-3">
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
