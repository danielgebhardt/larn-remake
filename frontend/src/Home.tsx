import { Dialog } from "@base-ui/react/dialog";
import { HelpCircleIcon, Save, Settings, UserRound } from "lucide-react";
import { type SubmitEvent, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import DungeonHelp from "@/settings/DungeonHelp.tsx";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./components/dungeon/DungeonLayout.tsx";
import ActivityLog from "./components/game/ActivityLog.tsx";
import AdventureSaveSheet from "./components/game/AdventureSaveSheet";
import CharacterDialog from "./components/game/CharacterDialog.tsx";
import { isLowHealth } from "./components/game/HealthDisplay";
import PickupDialog from "./components/game/PickupDialog";
import PlayerStatus from "./components/game/PlayerStatus.tsx";
import PotionHotbarView from "./components/game/PotionHotbarView";
import QuestStatus from "./components/game/QuestStatus";
import SpellHotbarView from "./components/game/SpellHotbarView";
import { useSpellTargeting } from "./components/game/useSpellTargeting";
import VictoryDialog from "./components/game/VictoryDialog";
import VisibleEffects from "./components/game/VisibleEffects";
import {
	connectDungeonFloors,
	type DungeonRun,
	generateDungeonRun,
} from "./domain/dungeon/DungeonRun.ts";
import { updateExploration } from "./domain/dungeon/Exploration.ts";
import {
	DEFAULT_FOG_CONFIGURATION,
	DEFAULT_RUN_CONFIGURATION,
	type FogConfiguration,
	type RunConfiguration,
} from "./domain/dungeon/RunConfiguration.ts";
import { MAX_SEED, parseSeedInput } from "./domain/dungeon/Seed.ts";
import type { VictorySummary } from "./domain/game/Adventure";
import { createGameState } from "./domain/game/GameState.ts";
import {
	type PlayerAction,
	resolvePlayerAction,
} from "./domain/game/PlayerActions.ts";
import { BAG_CAPACITY } from "./domain/items/Bag";
import { itemsAtPlayer } from "./domain/items/FloorItems";
import type { HotbarSlot } from "./domain/items/PotionHotbar";
import {
	createSaveDocument,
	type RestoredAdventure,
	restoreSave,
	type SaveDocument,
} from "./domain/saves/SaveFormat";
import Header from "./Header.tsx";
import DungeonSettings from "./settings/DungeonSettings.tsx";
import {
	type ConfigurationErrors,
	configurationDraft,
	parseRunConfiguration,
} from "./settings/RunConfigurationDraft.ts";

const createRun = (
	seed: number,
	configuration: RunConfiguration,
): DungeonRun => {
	const { floorCount, ...dungeonConfig } = configuration;
	return connectDungeonFloors(
		generateDungeonRun(seed, floorCount, dungeonConfig),
	);
};

type HomeProps = {
	initialFogConfiguration?: FogConfiguration;
	initialSeed?: number;
	initialAdventure?: RestoredAdventure;
	initialConfiguration?: RunConfiguration;
};

const Home = ({
	initialFogConfiguration = DEFAULT_FOG_CONFIGURATION,
	initialSeed,
	initialAdventure,
	initialConfiguration = DEFAULT_RUN_CONFIGURATION,
}: HomeProps) => {
	const [fogConfiguration, setFogConfiguration] = useState(
		initialAdventure?.fog ?? initialFogConfiguration,
	);
	const [game, setGame] = useState(() => {
		if (initialAdventure)
			return {
				state: initialAdventure.state,
				exploration: initialAdventure.exploration,
				actionError: "",
			};
		const run = createRun(initialSeed ?? 0, initialConfiguration);
		return {
			state: createGameState(run),
			exploration: updateExploration(run, fogConfiguration.radius),
			actionError: "",
		};
	});
	const { run, turn, player } = game.state;
	const [dismissedVictory, setDismissedVictory] =
		useState<VictorySummary | null>(null);
	const victory = game.state.quest.victory;
	const victoryOpen = victory !== null && dismissedVictory !== victory;
	const canPlay = player.health > 0 && victory === null;
	const { exploration } = game;
	const [configuration, setConfiguration] = useState(
		initialAdventure?.configuration ?? initialConfiguration,
	);
	const [configDraft, setConfigDraft] = useState(() =>
		configurationDraft(initialAdventure?.configuration ?? initialConfiguration),
	);
	const [configErrors, setConfigErrors] = useState<ConfigurationErrors>({});
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [seedInput, setSeedInput] = useState(() => String(run.seed));
	const [seedError, setSeedError] = useState<string | null>(null);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [saveOpen, setSaveOpen] = useState(false);
	const [restoreMapFocus, setRestoreMapFocus] = useState(false);
	const [helpOpen, setHelpOpen] = useState(false);
	const [characterOpen, setCharacterOpen] = useState(false);
	const [characterOpenedFromMap, setCharacterOpenedFromMap] = useState(false);
	const [pickupOpen, setPickupOpen] = useState(false);
	const mapRef = useRef<HTMLElement>(null);
	useEffect(() => {
		if (initialSeed !== undefined || initialAdventure)
			mapRef.current?.focus({ preventScroll: true });
	}, [initialSeed, initialAdventure]);
	const currentItems = itemsAtPlayer(game.state);
	// Empty loot or death ends selection; later movement must not reopen it.
	useEffect(() => {
		if (pickupOpen && (currentItems.length === 0 || player.health <= 0))
			setPickupOpen(false);
	}, [pickupOpen, currentItems.length, player.health]);

	const activeFloor = run.floors[run.activeFloor - 1];
	const activeMonsters = useMemo(
		() =>
			game.state.monsters.filter(
				(monster) =>
					monster.floorNumber === run.activeFloor && monster.health > 0,
			),
		[game.state.monsters, run.activeFloor],
	);
	const activeItems = useMemo(
		() =>
			game.state.floorItems.filter(
				(item) => item.floorNumber === run.activeFloor,
			),
		[game.state.floorItems, run.activeFloor],
	);
	const startRun = (
		seed: number,
		nextConfiguration: RunConfiguration,
	): boolean => {
		let nextRun: DungeonRun;
		try {
			nextRun = createRun(seed, nextConfiguration);
		} catch {
			setGenerationError(
				"Could not create a dungeon with this seed and configuration. Try a different seed or larger dimensions.",
			);
			setSettingsOpen(true);
			return false;
		}
		setGame({
			state: createGameState(nextRun),
			exploration: updateExploration(nextRun, fogConfiguration.radius),
			actionError: "",
		});
		setPickupOpen(false);
		setConfiguration(nextConfiguration);
		setConfigDraft(configurationDraft(nextConfiguration));
		setConfigErrors({});
		setGenerationError(null);
		setSeedInput(String(seed));
		setSeedError(null);
		return true;
	};

	const handleRestore = (document: SaveDocument) => {
		const loaded = restoreSave(document);
		setFogConfiguration(loaded.fog);
		setConfiguration(loaded.configuration);
		setConfigDraft(configurationDraft(loaded.configuration));
		setConfigErrors({});
		setGenerationError(null);
		setSeedInput(String(loaded.state.run.seed));
		setSeedError(null);
		setDismissedVictory(null);
		setGame({
			state: loaded.state,
			exploration: loaded.exploration,
			actionError: "",
		});
		setPickupOpen(false);
		setCharacterOpen(false);
		setHelpOpen(false);
		setRestoreMapFocus(true);
		setSaveOpen(false);
		setSettingsOpen(false);
	};

	const handleNewDungeon = () => {
		const seed = Math.floor(Math.random() * (MAX_SEED + 1));

		if (startRun(seed, configuration))
			mapRef.current?.focus({ preventScroll: true });
	};

	const handleSeedSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const seed = parseSeedInput(seedInput);
		const parsed = parseRunConfiguration(configDraft, configuration);
		setSeedError(
			seed === undefined ? `Enter a whole number from 0 to ${MAX_SEED}.` : null,
		);
		setConfigErrors(parsed.valid ? {} : parsed.errors);
		setGenerationError(null);
		if (seed === undefined || !parsed.valid) return;
		if (startRun(seed, parsed.value)) setSettingsOpen(false);
	};

	const handleActionRequested = (action: PlayerAction) => {
		setGame((current) => {
			const result = resolvePlayerAction(current.state, action);
			if (result.error) return { ...current, actionError: result.error };
			if (result.state === current.state && !current.actionError)
				return current;
			return {
				state: result.state,
				actionError: "",
				exploration: result.turnAdvanced
					? updateExploration(
							result.state.run,
							fogConfiguration.radius,
							current.exploration,
						)
					: current.exploration,
			};
		});
	};

	const mapInputAvailable =
		!settingsOpen &&
		!saveOpen &&
		!helpOpen &&
		!characterOpen &&
		!pickupOpen &&
		!victoryOpen;
	const gameplayEnabled = mapInputAvailable && canPlay;
	const spells = useSpellTargeting(
		game.state,
		fogConfiguration.enabled ? exploration.visible : undefined,
		gameplayEnabled,
		handleActionRequested,
		(message) => setGame((current) => ({ ...current, actionError: message })),
		() => mapRef.current?.focus({ preventScroll: true }),
	);

	const handlePotionRequested = (slot: HotbarSlot) => {
		handleActionRequested({ type: "use-hotbar", slot });
		mapRef.current?.focus({ preventScroll: true });
	};

	const handleFogRadiusApply = (radius: number) => {
		setFogConfiguration((current) => ({ ...current, radius }));
		setGame((current) => ({
			...current,
			exploration: updateExploration(
				current.state.run,
				radius,
				current.exploration,
			),
		}));
	};
	const handlePickupRequested = () => {
		const cure = currentItems.find((entry) => entry.item.kind === "cure");
		if (cure) {
			handleActionRequested({ type: "pickup", itemId: cure.item.id });
			return;
		}

		if (currentItems.length === 0) {
			setGame((current) => ({
				...current,
				actionError: "No items on this tile.",
			}));
		} else if (
			currentItems.length === 1 ||
			game.state.bag.items.length >= BAG_CAPACITY
		) {
			handleActionRequested({
				type: "pickup",
				itemId: currentItems[0].item.id,
			});
		} else {
			setGame((current) => ({ ...current, actionError: "" }));
			setPickupOpen(true);
		}
	};

	return (
		<div className="flex h-dvh flex-col bg-muted/30">
			<Header
				floorNumber={activeFloor.floorNumber}
				floorCount={run.floors.length}
				onNewDungeon={handleNewDungeon}
				characterAction={
					<Dialog.Root open={characterOpen} onOpenChange={setCharacterOpen}>
						<Dialog.Trigger
							onClick={() => setCharacterOpenedFromMap(false)}
							render={<Button type="button" variant="outline" />}
						>
							<UserRound aria-hidden="true" focusable="false" />
							Character
						</Dialog.Trigger>
						<CharacterDialog
							effects={game.state.effects}
							spellHotbar={game.state.spellHotbar}
							mana={game.state.mana}
							knownSpells={game.state.knownSpells}
							progression={game.state.progression}
							onCloseRequested={() => setCharacterOpen(false)}
							finalFocus={characterOpenedFromMap ? mapRef : undefined}
							player={player}
							won={victory !== null}
							quest={game.state.quest}
							equipment={game.state.equipment}
							bag={game.state.bag}
							potionHotbar={game.state.potionHotbar}
							floorItems={currentItems}
							turn={turn}
							history={game.state.activityHistory}
							actionError={game.actionError}
							onAction={handleActionRequested}
						/>
					</Dialog.Root>
				}
				saveAction={
					<Sheet
						open={saveOpen}
						onOpenChange={(open) => {
							setSaveOpen(open);
							if (open) setRestoreMapFocus(false);
						}}
						onOpenChangeComplete={(open) => {
							if (!open && restoreMapFocus && !victoryOpen)
								mapRef.current?.focus({ preventScroll: true });
						}}
					>
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<Save aria-hidden="true" focusable="false" />
							Save/Load
						</SheetTrigger>
						<AdventureSaveSheet
							finalFocus={restoreMapFocus ? mapRef : undefined}
							createSnapshot={() =>
								createSaveDocument(
									game.state,
									exploration,
									configuration,
									fogConfiguration,
								)
							}
							onRestore={handleRestore}
						/>
					</Sheet>
				}
				settingsAction={
					<Sheet
						open={settingsOpen}
						onOpenChange={setSettingsOpen}
						onOpenChangeComplete={(open) => {
							if (!open) mapRef.current?.focus({ preventScroll: true });
						}}
					>
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<Settings aria-hidden="true" focusable="false" />
							Settings
						</SheetTrigger>
						<DungeonSettings
							finalFocus={mapRef}
							fogConfiguration={fogConfiguration}
							onFogEnabledChange={(enabled) =>
								setFogConfiguration((current) => ({ ...current, enabled }))
							}
							onFogRadiusApply={handleFogRadiusApply}
							seed={run.seed}
							seedInput={seedInput}
							seedError={seedError}
							configuration={configuration}
							configDraft={configDraft}
							configErrors={configErrors}
							generationError={generationError}
							onConfigInputChange={(field, value) => {
								setConfigDraft((current) => ({ ...current, [field]: value }));
								setConfigErrors((current) => ({
									...current,
									[field]: undefined,
								}));
								setGenerationError(null);
							}}
							onSeedInputChange={(value) => {
								setSeedInput(value);
								setSeedError(null);
								setGenerationError(null);
							}}
							onSeedSubmit={handleSeedSubmit}
						/>
					</Sheet>
				}
				helpAction={
					<Sheet open={helpOpen} onOpenChange={setHelpOpen}>
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<HelpCircleIcon aria-hidden="true" focusable="false" />
							Help
						</SheetTrigger>
						<DungeonHelp
							monsters={activeMonsters}
							visible={
								fogConfiguration.enabled ? exploration.visible : undefined
							}
						/>
					</Sheet>
				}
			/>

			<main className="flex min-h-0 min-w-0 flex-1 p-4 sm:p-6">
				<section
					aria-label="Adventure"
					className={`flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border bg-card p-3 sm:p-4 ${isLowHealth(player) ? "border-destructive/60 ring-1 ring-destructive/20" : "border-border"}`}
				>
					<div className="flex shrink-0 flex-wrap items-center justify-center gap-x-5 gap-y-2 pb-3">
						<PotionHotbarView
							bag={game.state.bag}
							potionHotbar={game.state.potionHotbar}
							alive={gameplayEnabled && !spells.targeting}
							onActivate={handlePotionRequested}
						/>
						<SpellHotbarView
							slots={game.state.spellHotbar}
							knownSpells={game.state.knownSpells}
							enabled={gameplayEnabled}
							targeting={spells.targeting?.spell}
							onActivate={spells.activate}
						/>
						<PlayerStatus
							equipment={game.state.equipment}
							mana={game.state.mana}
							turn={turn}
							player={player}
							progression={game.state.progression}
						/>
					</div>
					<QuestStatus quest={game.state.quest} />
					<VisibleEffects
						effects={game.state.effects}
						monsters={activeMonsters}
						visible={fogConfiguration.enabled ? exploration.visible : undefined}
					/>
					{victory && (
						<Button
							variant="outline"
							size="sm"
							className="mb-3 self-center"
							onClick={() => setDismissedVictory(null)}
						>
							Victory summary
						</Button>
					)}
					{spells.description && (
						<p
							role="status"
							aria-label="Spell targeting"
							className="mb-2 rounded-md border border-violet-500/50 bg-violet-500/10 px-3 py-2 text-center text-sm"
						>
							{spells.description}
						</p>
					)}
					<DungeonLayout
						mapRef={mapRef}
						onSpellRequested={spells.activate}
						onSpellSlotRequested={(slot) => {
							const spell = game.state.spellHotbar[slot - 1];
							if (spell) spells.activate(spell);
							else
								setGame((current) => ({
									...current,
									actionError: `Spell slot ${slot} is empty. Assign a spell in Character.`,
								}));
						}}
						onTargetingKey={spells.targeting ? spells.handleKey : undefined}
						targetIds={spells.targetIds}
						spellArea={spells.spellArea}
						selectedTargetId={spells.targeting?.id}
						onTargetRequested={spells.targeting ? spells.castTarget : undefined}
						monsters={activeMonsters}
						floorItems={activeItems}
						dungeon={activeFloor.terrain}
						visible={fogConfiguration.enabled ? exploration.visible : undefined}
						explored={
							fogConfiguration.enabled
								? exploration.explored.get(run.activeFloor)
								: undefined
						}
						playerPosition={run.playerCoordinate}
						upStair={activeFloor.upStair?.coordinate}
						entrance={
							run.activeFloor === 1 ? game.state.quest.entrance : undefined
						}
						downStair={activeFloor.downStair?.coordinate}
						onMoveRequested={(direction) =>
							handleActionRequested({ type: "move", direction })
						}
						onWaitRequested={() => handleActionRequested({ type: "wait" })}
						onPickupRequested={handlePickupRequested}
						onPotionRequested={handlePotionRequested}
						onCharacterRequested={
							mapInputAvailable
								? () => {
										setCharacterOpenedFromMap(true);
										setCharacterOpen(true);
									}
								: undefined
						}
						movementEnabled={gameplayEnabled}
					/>
					{game.actionError && (
						<p
							role="status"
							aria-label="Action feedback"
							className="py-2 text-sm text-muted-foreground"
						>
							{game.actionError}
						</p>
					)}
					<ActivityLog history={game.state.activityHistory} />
				</section>
			</main>
			<VictoryDialog
				summary={victory}
				open={victoryOpen}
				onDismiss={() => setDismissedVictory(victory)}
				onNewDungeon={handleNewDungeon}
				onReplay={() => {
					if (startRun(run.seed, configuration))
						mapRef.current?.focus({ preventScroll: true });
				}}
				mapRef={mapRef}
			/>
			<PickupDialog
				open={pickupOpen}
				onOpenChange={setPickupOpen}
				items={currentItems}
				player={player}
				turn={turn}
				history={game.state.activityHistory}
				error={game.actionError}
				onAction={handleActionRequested}
				mapRef={mapRef}
			/>
			<footer className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-6">
				<span>Server:</span>
				<APICheck />
			</footer>
		</div>
	);
};

export default Home;
