import { Backpack, Shield, Sword } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BAG_CAPACITY, type Bag } from "../../domain/items/Bag";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";

const BagContents = ({ bag }: { bag: Bag }) => {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const selected = bag.items.find((item) => item.id === selectedId);
	const details = selected ? ITEM_DEFINITIONS[selected.kind] : null;
	return (
		<section aria-labelledby="character-bag-title" className="grid gap-3">
			<h3
				id="character-bag-title"
				className="flex items-center gap-2 font-medium"
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
						const Icon = definition.type === "weapon" ? Sword : Shield;
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
									<Icon
										aria-hidden="true"
										className="size-4 shrink-0 text-muted-foreground"
									/>
									<span className="grid gap-0.5">
										<span className="font-medium">{definition.name}</span>
										<span className="text-xs font-normal text-muted-foreground">
											{definition.type === "weapon" ? "Weapon" : "Shield"} ·
											Slot {index + 1}
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
						{details.type === "weapon" ? "Weapon" : "Shield"}
					</p>
					<p className="text-sm leading-relaxed text-muted-foreground">
						{details.description}
					</p>
					<p className="text-xs font-medium tabular-nums">
						{details.type === "weapon"
							? `Attack bonus +${details.attackBonus}`
							: `Armor ${details.armor}`}
					</p>
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
