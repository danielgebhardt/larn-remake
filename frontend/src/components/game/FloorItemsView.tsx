import { useRef } from "react";
import { Button } from "@/components/ui/button";
import type { FloorItem, FloorItemAction } from "../../domain/items/FloorItems";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import ItemIcon from "../items/ItemIcon";

const FloorItemsView = ({
	items,
	alive,
	onAction,
}: {
	items: readonly FloorItem[];
	alive: boolean;
	onAction: (action: FloorItemAction) => void;
}) => {
	const heading = useRef<HTMLHeadingElement>(null);
	return (
		<section aria-labelledby="ground-items-title" className="grid gap-3">
			<h3
				ref={heading}
				tabIndex={-1}
				id="ground-items-title"
				className="font-medium outline-none"
			>
				On your tile
			</h3>
			{items.length === 0 ? (
				<p className="text-xs text-muted-foreground">No items on this tile.</p>
			) : (
				<ul className="grid max-h-64 gap-2 overflow-y-auto p-1">
					{items.map(({ item }, index) => (
						<li key={item.id}>
							<Button
								type="button"
								variant="outline"
								disabled={!alive}
								aria-label={`Pick up ${ITEM_DEFINITIONS[item.kind].name}, item ${index + 1}`}
								className="h-auto w-full justify-start gap-3 whitespace-normal p-3"
								onClick={() => {
									onAction({ type: "pickup", itemId: item.id });
									heading.current?.focus({ preventScroll: true });
								}}
							>
								<span className="size-4 shrink-0">
									<ItemIcon kind={item.kind} />
								</span>
								Pick up {ITEM_DEFINITIONS[item.kind].name}
							</Button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
};
export default FloorItemsView;
