import { Backpack } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { PlayerAction } from "../../domain/game/PlayerActions";
import { BAG_CAPACITY, type Bag } from "../../domain/items/Bag";
import { equipmentSlotFor } from "../../domain/items/Equipment";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import ItemIcon from "../items/ItemIcon";

const typeLabels = { weapon: "Weapon", shield: "Shield", potion: "Potion" };

const BagContents = ({
	bag,
	canChangeGear,
	onAction,
}: {
	bag: Bag;
	canChangeGear: boolean;
	onAction: (action: PlayerAction) => void;
}) => {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const headingRef = useRef<HTMLHeadingElement>(null);
	const selected = bag.items.find((item) => item.id === selectedId);
	const details = selected ? ITEM_DEFINITIONS[selected.kind] : null;
	const slot = selected ? equipmentSlotFor(selected) : null;
	return (
		<section aria-labelledby="character-bag-title" className="grid gap-3">
			<h3
				ref={headingRef}
				tabIndex={-1}
				id="character-bag-title"
				className="flex items-center gap-2 font-medium outline-none"
			>
				<Backpack aria-hidden="true" className="size-4 text-muted-foreground" />{" "}
				Bag
			</h3>
			<output
				aria-label="Bag capacity"
				className="text-xs tabular-nums text-muted-foreground"
			>
				{bag.items.length} / {BAG_CAPACITY} slots used ·{" "}
				{BAG_CAPACITY - bag.items.length} available
			</output>
			{bag.items.length === 0 ? (
				<p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
					Your bag is empty.
				</p>
			) : (
				<ul
					aria-label="Carried items"
					className="grid max-h-64 gap-2 overflow-y-auto p-1"
				>
					{bag.items.map((item, index) => {
						const definition = ITEM_DEFINITIONS[item.kind];
						return (
							<li key={item.id}>
								<Button
									type="button"
									variant="outline"
									aria-label={`${definition.name}, slot ${index + 1}`}
									aria-pressed={selectedId === item.id}
									onClick={() => setSelectedId(item.id)}
									className="h-auto w-full justify-start gap-3 whitespace-normal p-3 text-left aria-pressed:border-primary aria-pressed:bg-primary/10"
								>
									<span className="size-4 shrink-0">
										<ItemIcon kind={item.kind} />
									</span>
									<span className="grid gap-0.5">
										<span className="font-medium">{definition.name}</span>
										<span className="text-xs font-normal text-muted-foreground">
											{typeLabels[definition.type]} · Slot {index + 1}
										</span>
									</span>
								</Button>
							</li>
						);
					})}
				</ul>
			)}
			{details ? (
				<section
					aria-labelledby="bag-item-details-title"
					className="grid gap-2 rounded-lg border bg-muted/30 p-4"
				>
					<h4
						id="bag-item-details-title"
						className="text-xs font-medium text-muted-foreground"
					>
						Item details
					</h4>
					<p className="font-medium">{details.name}</p>
					<p className="text-xs text-muted-foreground">
						{typeLabels[details.type]}
					</p>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{details.description}
					</p>
					<p className="text-xs font-medium tabular-nums">
						{details.type === "potion"
							? `Recovery up to ${details.healing} health`
							: details.type === "weapon"
								? `Attack bonus +${details.attackBonus}`
								: `Armor ${details.armor}`}
					</p>
					{selected && (
						<Button
							type="button"
							variant="outline"
							disabled={!canChangeGear}
							onClick={() => {
								onAction({ type: "drop", itemId: selected.id });
								headingRef.current?.focus({ preventScroll: true });
							}}
						>
							Drop item
						</Button>
					)}
					{selected && slot && (
						<Button
							type="button"
							disabled={!canChangeGear}
							onClick={() => {
								onAction({
									type: "equip",
									itemId: selected.id,
									slot,
								});
								headingRef.current?.focus({ preventScroll: true });
							}}
						>
							Equip in {slot === "mainHand" ? "main hand" : "off hand"}
						</Button>
					)}
					{selected && details.type === "potion" && (
						<Button
							type="button"
							disabled={!canChangeGear}
							onClick={() => {
								onAction({ type: "consume", itemId: selected.id });
								headingRef.current?.focus({ preventScroll: true });
							}}
						>
							Drink potion
						</Button>
					)}
				</section>
			) : bag.items.length > 0 ? (
				<p className="text-xs text-muted-foreground">
					Select an item to see its details.
				</p>
			) : null}
		</section>
	);
};

export default BagContents;
