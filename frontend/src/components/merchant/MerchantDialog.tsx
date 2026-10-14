import { Dialog } from "@base-ui/react/dialog";
import { Tabs } from "@base-ui/react/tabs";
import {
	type RefObject,
	useId,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import type { GameState } from "../../domain/game/GameState";
import { compareEquipment } from "../../domain/items/EquipmentComparison";
import { ITEM_DEFINITIONS } from "../../domain/items/Item";
import { itemName } from "../../domain/items/ItemValues";
import {
	equipmentSalePrice,
	MERCHANT_OFFERS,
	type MerchantSupply,
} from "../../domain/merchant/MerchantRules";
import {
	comparisonDescription,
	comparisonStyles,
} from "../game/EquipmentComparisonView";
import EquipmentPreviews from "../game/EquipmentPreviews";
import ItemIcon from "../items/ItemIcon";
import MerchantIcon from "../objects/MerchantIcon";

type Props = {
	open: boolean;
	state: GameState;
	error?: string;
	onClose: () => void;
	mapRef: RefObject<HTMLElement | null>;
	onBuy?: (kind: MerchantSupply) => void;
	onSell?: (itemId: string) => void;
};
const MerchantDialog = ({
	open,
	state,
	error,
	onClose,
	mapRef,
	onBuy,
	onSell,
}: Props) => {
	const titleRef = useRef<HTMLHeadingElement>(null),
		[tab, setTab] = useState<"buy" | "sell">("buy");
	const buyTab = useRef<HTMLButtonElement>(null),
		firstSale = useRef<HTMLButtonElement>(null),
		sellTab = useRef<HTMLButtonElement>(null),
		[focusAfterSale, setFocusAfterSale] = useState(false);
	useLayoutEffect(() => {
		if (open && focusAfterSale) {
			(firstSale.current ?? sellTab.current)?.focus();
			setFocusAfterSale(false);
		}
	}, [open, focusAfterSale]);
	const comparisonId = useId();
	const supplies = Object.keys(MERCHANT_OFFERS) as MerchantSupply[];
	const gear = state.bag.items.filter(
		(item) => equipmentSalePrice(item) !== null,
	);
	return (
		<Dialog.Root
			open={open}
			onOpenChange={(value) => {
				if (!value) onClose();
			}}
		>
			<Dialog.Portal>
				<Dialog.Backdrop className="fixed inset-0 z-50 bg-black/40 supports-backdrop-filter:backdrop-blur-xs" />
				<Dialog.Popup
					initialFocus={titleRef}
					finalFocus={mapRef}
					className="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-[min(48rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-4 rounded-xl border bg-card p-6 shadow-xl"
					onKeyDown={(event) => {
						if (event.repeat || event.ctrlKey || event.metaKey || event.altKey)
							return;
						const key = event.key.toLowerCase();
						if (key === "b" || key === "s") {
							event.preventDefault();
							event.stopPropagation();
							setTab(key === "b" ? "buy" : "sell");
							(key === "b" ? buyTab.current : sellTab.current)?.focus();
						}
						const index = Number(key) - 1;
						if (
							tab === "buy" &&
							Number.isInteger(index) &&
							index >= 0 &&
							index < supplies.length
						) {
							event.preventDefault();
							event.stopPropagation();
							const kind = supplies[index];
							if (
								onBuy &&
								state.gold >= MERCHANT_OFFERS[kind].price &&
								state.merchantStock[kind] > 0
							)
								onBuy(kind);
						}
					}}
				>
					<header className="flex items-start justify-between gap-4">
						<div>
							<Dialog.Title
								ref={titleRef}
								tabIndex={-1}
								className="flex items-center gap-2 text-lg font-semibold outline-none"
							>
								<span className="size-7">
									<MerchantIcon />
								</span>
								Wandering potion merchant
							</Dialog.Title>
							<Dialog.Description className="mt-1 text-sm text-muted-foreground">
								One shared stock for this adventure. Browsing is free; every
								successful trade takes a turn and monsters act.
							</Dialog.Description>
						</div>
						<Dialog.Close render={<Button variant="outline" />}>
							Close
						</Dialog.Close>
					</header>
					<p className="font-semibold">Gold {state.gold}</p>
					<Tabs.Root
						value={tab}
						onValueChange={(value) => {
							if (value === "buy" || value === "sell") setTab(value);
						}}
						className="flex min-h-0 flex-col gap-4"
					>
						<Tabs.List
							className="flex shrink-0 gap-2 border-b"
							aria-label="Merchant trading"
						>
							<Tabs.Tab
								value="buy"
								ref={buyTab}
								className="rounded-t px-4 py-2 font-semibold data-[active]:border-b-2 data-[active]:border-primary"
							>
								Buy
							</Tabs.Tab>
							<Tabs.Tab
								value="sell"
								ref={sellTab}
								className="rounded-t px-4 py-2 font-semibold data-[active]:border-b-2 data-[active]:border-primary"
							>
								Sell
							</Tabs.Tab>
						</Tabs.List>
						<Tabs.Panel
							value="buy"
							className="grid min-h-0 gap-3 overflow-y-auto sm:grid-cols-2"
						>
							{supplies.map((kind, index) => (
								<Button
									key={kind}
									variant="outline"
									className="h-auto items-center justify-start gap-3 whitespace-normal p-4 text-left"
									disabled={
										!onBuy ||
										state.merchantStock[kind] === 0 ||
										state.gold < MERCHANT_OFFERS[kind].price
									}
									onClick={() => onBuy?.(kind)}
								>
									<kbd className="rounded border px-2 py-1">{index + 1}</kbd>
									<span className="size-7 shrink-0">
										<ItemIcon kind={kind} />
									</span>
									<span>
										<span className="block font-semibold">
											{ITEM_DEFINITIONS[kind].name}
										</span>
										<span className="block text-xs text-muted-foreground">
											{MERCHANT_OFFERS[kind].price} gold ·{" "}
											{state.merchantStock[kind]} remaining
										</span>
										<span className="mt-1 block text-xs font-normal text-muted-foreground">
											{ITEM_DEFINITIONS[kind].description}
										</span>
									</span>
								</Button>
							))}
						</Tabs.Panel>
						<Tabs.Panel value="sell" className="min-h-0 overflow-y-auto">
							<p className="mb-3 text-sm text-muted-foreground">
								Unequip worn gear first. Only equipment in your bag can be sold;
								potions, books and the cure stay yours.
							</p>
							{gear.length ? (
								<ul className="grid gap-2 sm:grid-cols-2">
									{gear.map((item, index) => {
										const comparison = compareEquipment(item, state);
										const descriptionId = `${comparisonId}-${item.id}`;
										return (
											<li
												key={item.id}
												className="grid content-start gap-2 rounded-lg border bg-muted/20 p-2"
											>
												<Button
													variant="outline"
													className={`h-auto w-full justify-start gap-3 whitespace-normal p-3 text-left ${comparison ? comparisonStyles[comparison.label].border : ""}`}
													aria-label={`${itemName(item)} · Sell for ${equipmentSalePrice(item)} gold`}
													ref={index === 0 ? firstSale : undefined}
													disabled={!onSell}
													aria-describedby={
														comparison ? descriptionId : undefined
													}
													onClick={() => {
														onSell?.(item.id);
														setFocusAfterSale(true);
													}}
												>
													<span className="size-6 shrink-0">
														<ItemIcon kind={item.kind} />
													</span>
													<span>
														<span className="block">{itemName(item)}</span>
														<span className="block text-xs text-muted-foreground">
															Sell for {equipmentSalePrice(item)} gold
														</span>
														{comparison && (
															<span
																aria-hidden="true"
																className={`block text-xs font-medium ${comparisonStyles[comparison.label].text}`}
															>
																{comparison.label}
															</span>
														)}
													</span>
												</Button>
												{comparison && (
													<>
														<span id={descriptionId} className="sr-only">
															{comparisonDescription(comparison)}
														</span>
														<details className="text-xs">
															<summary className="cursor-pointer rounded px-1 py-1 text-muted-foreground">
																Compare {itemName(item)}
															</summary>
															<div className="mt-2">
																<EquipmentPreviews
																	item={item}
																	context={state}
																/>
															</div>
														</details>
													</>
												)}
											</li>
										);
									})}
								</ul>
							) : (
								<p className="text-sm text-muted-foreground">
									No carried equipment to sell.
								</p>
							)}
						</Tabs.Panel>
					</Tabs.Root>
					{error && (
						<p role="alert" className="text-sm text-destructive">
							{error}
						</p>
					)}
					<p className="text-xs text-muted-foreground">
						B / S switches tabs · 1–4 buys on Buy · Tab and Enter select
						equipment on Sell · Escape closes.
					</p>
				</Dialog.Popup>
			</Dialog.Portal>
		</Dialog.Root>
	);
};
export default MerchantDialog;
