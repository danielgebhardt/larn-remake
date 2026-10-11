import { Backpack } from "lucide-react";
import { type ReactNode, type RefObject, useId } from "react";
import { Button } from "@/components/ui/button";
import { BAG_CAPACITY, type Bag } from "../../domain/items/Bag";
import type { Equipment } from "../../domain/items/Equipment";
import { compareEquipment } from "../../domain/items/EquipmentComparison";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import ItemIcon from "../items/ItemIcon";
import {
	comparisonDescription,
	comparisonStyles,
} from "./EquipmentComparisonView";

const BagContents = ({
	bag,
	equipment,
	selectedId,
	onSelect,
	headingRef,
	children,
}: {
	bag: Bag;
	equipment: Equipment;
	selectedId: string | null;
	onSelect: (id: string) => void;
	headingRef: RefObject<HTMLHeadingElement | null>;
	children: ReactNode;
}) => {
	const comparisonId = useId();
	return (
		<section
			aria-labelledby="character-bag-title"
			className="grid content-start gap-3"
		>
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
			<ul
				aria-label="Carried items"
				className="grid w-max grid-cols-[repeat(4,3.5rem)] md:grid-cols-[repeat(5,3.5rem)] gap-2 p-1"
			>
				{Array.from({ length: BAG_CAPACITY }, (_, index) => {
					const item = bag.items[index];
					const comparison = item ? compareEquipment(item, equipment) : null;
					const descriptionId = `${comparisonId}-${index}`;
					return (
						<li key={item?.id ?? `empty:${index}`}>
							{item ? (
								<Button
									type="button"
									variant="outline"
									aria-label={`${ITEM_DEFINITIONS[item.kind].name}, slot ${index + 1}`}
									aria-pressed={selectedId === item.id}
									aria-describedby={comparison ? descriptionId : undefined}
									onClick={() => onSelect(item.id)}
									className={`grid size-14 justify-items-center ${comparison ? "grid-rows-[1rem_minmax(0,1fr)_0.625rem] gap-0" : "gap-1"} whitespace-normal rounded-md p-1 aria-pressed:bg-primary/10 aria-pressed:ring-2 aria-pressed:ring-primary/60 aria-pressed:ring-offset-1 aria-pressed:ring-offset-card ${comparison ? comparisonStyles[comparison.label].border : ""}`}
								>
									<span className={comparison ? "size-4" : "size-5"}>
										<ItemIcon kind={item.kind} />
									</span>
									<span className="line-clamp-2 text-[9px] leading-tight">
										{ITEM_DEFINITIONS[item.kind].name}
									</span>
									{comparison && (
										<>
											<span
												aria-hidden="true"
												className={`text-[8px] leading-tight font-medium ${comparisonStyles[comparison.label].text}`}
											>
												{comparison.label}
											</span>
											<span id={descriptionId} className="sr-only">
												{comparisonDescription(comparison)}
											</span>
										</>
									)}
								</Button>
							) : (
								<span
									role="img"
									aria-label={`Empty bag slot ${index + 1}`}
									className="flex size-14 items-center justify-center rounded-md border border-dashed bg-muted/20 text-xs tabular-nums text-muted-foreground/50"
								>
									{index + 1}
								</span>
							)}
						</li>
					);
				})}
			</ul>
			{bag.items.length === 0 && (
				<p className="text-xs text-muted-foreground">Your bag is empty.</p>
			)}
			{children}
		</section>
	);
};
export default BagContents;
