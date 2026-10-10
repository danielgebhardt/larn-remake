import { Button } from "@/components/ui/button";
import type { Bag } from "../../domain/items/Bag";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import {
	HOTBAR_SLOTS,
	type HotbarSlot,
	hotbarSlotContents,
	type PotionHotbar,
} from "../../domain/items/PotionHotbar";
import ItemIcon from "../items/ItemIcon";

const PotionHotbarView = ({
	bag,
	potionHotbar,
	alive,
	onActivate,
}: {
	bag: Bag;
	potionHotbar: PotionHotbar;
	alive: boolean;
	onActivate: (slot: HotbarSlot) => void;
}) => (
	<section aria-label="Potion hotbar" className="flex items-center gap-1.5">
		{HOTBAR_SLOTS.map((slot) => {
			const { kind, count } = hotbarSlotContents({ bag, potionHotbar }, slot);
			const label = `Potion slot ${slot}: ${kind ? `${ITEM_DEFINITIONS[kind].name}, ${count} carried` : "empty"}`;
			return (
				<Button
					key={slot}
					type="button"
					variant="outline"
					disabled={!alive}
					aria-label={label}
					title={label}
					onClick={() => onActivate(slot)}
					className="relative size-12 rounded-md p-2"
				>
					<kbd className="absolute top-0.5 left-1 text-[10px] leading-none text-muted-foreground">
						{slot}
					</kbd>
					{kind ? (
						<span className={`size-6 ${count === 0 ? "opacity-40" : ""}`}>
							<ItemIcon kind={kind} />
						</span>
					) : (
						<span aria-hidden="true" className="text-muted-foreground/40">
							—
						</span>
					)}
					{kind && (
						<span
							aria-hidden="true"
							className="absolute right-1 bottom-0.5 text-[10px] font-medium tabular-nums"
						>
							{count}
						</span>
					)}
				</Button>
			);
		})}
	</section>
);
export default PotionHotbarView;
