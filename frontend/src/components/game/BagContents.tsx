import { Backpack } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import { Button } from "@/components/ui/button";
import { BAG_CAPACITY, type Bag } from "../../domain/items/Bag";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import ItemIcon from "../items/ItemIcon";

const BagContents = ({
	bag,
	selectedId,
	onSelect,
	headingRef,
	children,
}: {
	bag: Bag;
	selectedId: string | null;
	onSelect: (id: string) => void;
	headingRef: RefObject<HTMLHeadingElement | null>;
	children: ReactNode;
}) => (
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
			className="grid w-max grid-cols-[repeat(4,3.5rem)] gap-2 p-1"
		>
			{Array.from({ length: BAG_CAPACITY }, (_, index) => {
				const item = bag.items[index];
				return (
					<li key={item?.id ?? `empty:${index}`}>
						{item ? (
							<Button
								type="button"
								variant="outline"
								aria-label={`${ITEM_DEFINITIONS[item.kind].name}, slot ${index + 1}`}
								aria-pressed={selectedId === item.id}
								onClick={() => onSelect(item.id)}
								className="grid size-14 justify-items-center gap-1 whitespace-normal rounded-md p-1 aria-pressed:border-primary aria-pressed:bg-primary/10"
							>
								<span className="size-5">
									<ItemIcon kind={item.kind} />
								</span>
								<span className="line-clamp-2 text-[9px] leading-tight">
									{ITEM_DEFINITIONS[item.kind].name}
								</span>
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
export default BagContents;
