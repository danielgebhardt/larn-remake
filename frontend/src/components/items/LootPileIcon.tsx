import { PackageOpen } from "lucide-react";

const LootPileIcon = ({ count }: { count: number }) => (
	<span aria-hidden="true" className="relative block size-full text-item-gear">
		<PackageOpen focusable="false" className="size-full" />
		<span className="absolute bottom-0 right-0 rounded-xs bg-background px-0.5 text-[9px] font-bold leading-[10px] tabular-nums text-foreground">
			{count > 9 ? "9+" : count}
		</span>
	</span>
);
export default LootPileIcon;
