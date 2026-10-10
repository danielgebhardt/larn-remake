import { Dialog } from "@base-ui/react/dialog";
import { Heart, Shield, Sword, UserRound } from "lucide-react";
import { type RefObject, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { ActivityHistory } from "../../domain/game/ActivityHistory";
import { deriveCombatStats } from "../../domain/game/CombatStats";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import type { PlayerStats } from "../../domain/game/PlayerStats";
import type { Bag } from "../../domain/items/Bag";
import type { Equipment } from "../../domain/items/Equipment";
import type { FloorItem } from "../../domain/items/FloorItems";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import { formatActivityEvent } from "./ActivityMessages";
import BagContents from "./BagContents";
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

const slots = [
	{ key: "mainHand", label: "Main hand", Icon: Sword },
	{ key: "offHand", label: "Off hand", Icon: Shield },
] as const;

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
	const combat = deriveCombatStats(equipment);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const equipmentHeadingRef = useRef<HTMLHeadingElement>(null);
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
					<div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
						<Heart aria-hidden="true" className="size-5 text-player" />
						<output
							aria-label="Character health"
							className="font-medium tabular-nums"
						>
							Health {player.health} / {player.maxHealth}
						</output>
					</div>
					<div className="grid gap-2">
						<div className="grid grid-cols-2 gap-3">
							<div className="rounded-lg border bg-muted/30 p-3">
								<output
									aria-label="Character attack"
									className="font-medium tabular-nums"
								>
									Attack {combat.attack}
								</output>
								<p className="mt-1 text-xs text-muted-foreground">
									Base {combat.baseAttack} + weapon {combat.weaponBonus}
								</p>
							</div>
							<div className="rounded-lg border bg-muted/30 p-3">
								<output
									aria-label="Character armor"
									className="font-medium tabular-nums"
								>
									Armor {combat.armor}
								</output>
								<p className="mt-1 text-xs text-muted-foreground">
									From equipped gear
								</p>
							</div>
						</div>
						<p className="text-xs leading-relaxed text-muted-foreground">
							Armor reduces incoming damage. Hits always deal at least 1 damage.
						</p>
					</div>
					<section
						aria-labelledby="character-equipment-title"
						className="grid gap-3"
					>
						<h3
							ref={equipmentHeadingRef}
							tabIndex={-1}
							id="character-equipment-title"
							className="flex items-center gap-2 font-medium outline-none"
						>
							<UserRound
								aria-hidden="true"
								className="size-4 text-muted-foreground"
							/>
							Equipment
						</h3>
						{slots.map(({ key, label, Icon }) => {
							const item = equipment[key];
							const definition = item ? ITEM_DEFINITIONS[item.kind] : null;
							return (
								<section
									key={key}
									aria-labelledby={`character-${key}`}
									className="rounded-lg border bg-muted/30 p-4"
								>
									<div className="flex items-center gap-3">
										<span className="flex size-10 shrink-0 items-center justify-center rounded-md border bg-background">
											<Icon
												aria-hidden="true"
												className="size-5 text-muted-foreground"
											/>
										</span>
										<div className="min-w-0">
											<h4
												id={`character-${key}`}
												className="text-xs font-medium text-muted-foreground"
											>
												{label}
											</h4>
											<p className="mt-1 font-medium">
												{definition?.name ?? `${label} empty`}
											</p>
										</div>
									</div>
									{definition && (
										<p className="mt-3 text-sm leading-relaxed text-muted-foreground">
											{definition.description}
										</p>
									)}
									{item && (
										<Button
											type="button"
											variant="outline"
											size="sm"
											className="mt-3"
											disabled={player.health <= 0}
											onClick={() => {
												onAction({ type: "unequip", slot: key });
												equipmentHeadingRef.current?.focus({
													preventScroll: true,
												});
											}}
										>
											Unequip {label.toLowerCase()}
										</Button>
									)}
								</section>
							);
						})}
					</section>
					<BagContents
						bag={bag}
						canChangeGear={player.health > 0}
						onAction={onAction}
					/>
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
