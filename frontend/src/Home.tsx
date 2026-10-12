import { Dialog } from "@base-ui/react/dialog";
import {
	HelpCircleIcon,
	LibraryBig,
	Save,
	Settings,
	UserRound,
} from "lucide-react";
import {
	lazy,
	type SubmitEvent,
	Suspense,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import DungeonHelp from "@/settings/DungeonHelp.tsx";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./components/dungeon/DungeonLayout.tsx";
import ActivityLog from "./components/game/ActivityLog.tsx";
import AdventureSaveSheet from "./components/game/AdventureSaveSheet";
import CharacterDialog from "./components/game/CharacterDialog.tsx";
import GameOverDialog from "./components/game/GameOverDialog";
import { isLowHealth } from "./components/game/HealthDisplay";
import PickupDialog from "./components/game/PickupDialog";
import PlayerStatus from "./components/game/PlayerStatus.tsx";
import PotionHotbarView from "./components/game/PotionHotbarView";
import QuestStatus from "./components/game/QuestStatus";
import SpellHotbarView from "./components/game/SpellHotbarView";
import { useSpellTargeting } from "./components/game/useSpellTargeting";
import VictoryDialog from "./components/game/VictoryDialog";
import VisibleEffects from "./components/game/VisibleEffects";
import ObjectChoiceDialog from "./components/objects/ObjectChoiceDialog";
import ObjectContext from "./components/objects/ObjectContext";
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
import type { DungeonObject } from "./domain/objects/DungeonObject";
import { navigationRun } from "./domain/objects/NavigationTerrain";
import { objectChoices } from "./domain/objects/ObjectChoices";
import { nearbyInteractionObjects } from "./domain/objects/ObjectInteraction";
import {
	createSaveDocument,
	type RestoredAdventure,
	restoreSave,
	type SaveDocument,
} from "./domain/saves/SaveFormat";
import Header from "./Header.tsx";
import DungeonSettings from "./settings/DungeonSettings.tsx";
import { APP_FEATURES } from "./settings/FeatureFlags";
import {
	type ConfigurationErrors,
	configurationDraft,
	parseRunConfiguration,
} from "./settings/RunConfigurationDraft.ts";

const DeveloperCatalog = lazy(
	() => import("./components/game/DeveloperCatalog"),
);

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
		const state = createGameState(run);
		return {
			state,
			exploration: updateExploration(
				navigationRun(state),
				fogConfiguration.radius,
			),
			actionError: "",
		};
	});
	const { run, turn, player } = game.state;
	const [dismissedVictory, setDismissedVictory] =
		useState<VictorySummary | null>(null);
	const [dismissedDeath, setDismissedDeath] = useState(false);
	const deathOpen = player.health === 0 && !dismissedDeath;
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
	const [catalogOpen, setCatalogOpen] = useState(false);
	const [helpOpen, setHelpOpen] = useState(false);
	const [characterOpen, setCharacterOpen] = useState(false);
	const [characterOpenedFromMap, setCharacterOpenedFromMap] = useState(false);
	const [interactionObject, setInteractionObject] =
		useState<DungeonObject | null>(null);
	const [interactionTargets, setInteractionTargets] = useState<
		readonly DungeonObject[]
	>([]);
	const [pickupOpen, setPickupOpen] = useState(false);
	const mapRef = useRef<HTMLElement>(null);
	useEffect(() => {
		if (initialSeed !== undefined || initialAdventure?.state.player.health)
			mapRef.current?.focus({ preventScroll: true });
	}, [initialSeed, initialAdventure]);
	useEffect(() => {
		if (!deathOpen) return;
		setCharacterOpen(false);
		setPickupOpen(false);
		setInteractionObject(null);
		setInteractionTargets([]);
		setSettingsOpen(false);
		setSaveOpen(false);
		setHelpOpen(false);
		setCatalogOpen(false);
	}, [deathOpen]);
	const currentItems = itemsAtPlayer(game.state);
	// Empty loot or death ends selection; later movement must not reopen it.
	useEffect(() => {
		if (pickupOpen && (currentItems.length === 0 || player.health <= 0))
			setPickupOpen(false);
	}, [pickupOpen, currentItems.length, player.health]);

	const activeFloor = navigationRun(game.state).floors[run.activeFloor - 1];
	const activeObjects = useMemo(
		() =>
			game.state.objects.filter(
				(object) =>
					object.floorNumber === run.activeFloor &&
					!(object.kind === "gold" && object.activated),
			),
		[game.state.objects, run.activeFloor],
	);
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
		const nextState = createGameState(nextRun);
		setGame({
			state: nextState,
			exploration: updateExploration(
				navigationRun(nextState),
				fogConfiguration.radius,
			),
			actionError: "",
		});
		setPickupOpen(false);
		setDismissedDeath(false);
		setInteractionObject(null);
		setInteractionTargets([]);
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
		setDismissedDeath(false);
		setInteractionObject(null);
		setInteractionTargets([]);
		setCharacterOpen(false);
		setHelpOpen(false);
		setCatalogOpen(false);
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
							navigationRun(result.state),
							fogConfiguration.radius,
							current.exploration,
						)
					: current.exploration,
			};
		});
	};

	const selectInteractionObject = (object: DungeonObject) => {
		if (!object.activated && objectChoices(object).length)
			setInteractionObject(object);
		else handleActionRequested({ type: "interact", objectId: object.id });
		setInteractionTargets([]);
	};
	const handleInteractRequested = () => {
		const nearby = nearbyInteractionObjects(game.state).filter(
			(object) =>
				!fogConfiguration.enabled ||
				exploration.visible[object.coordinate.row]?.[object.coordinate.col],
		);
		const usable = nearby.filter(
			(object) => object.kind === "door" || !object.activated,
		);
		const selected = usable[0] ?? nearby[0];
		if (usable.length > 1) setInteractionTargets(usable);
		else if (selected) selectInteractionObject(selected);
		else handleActionRequested({ type: "interact" });
	};
	const mapInputAvailable =
		!deathOpen &&
		interactionObject === null &&
		interactionTargets.length === 0 &&
		!settingsOpen &&
		!saveOpen &&
		!helpOpen &&
		!catalogOpen &&
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
				navigationRun(current.state),
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
							gold={game.state.gold}
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
							if (!open && restoreMapFocus && mapInputAvailable)
								mapRef.current?.focus({ preventScroll: true });
						}}
					>
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<Save aria-hidden="true" focusable="false" />
							Save/Load
						</SheetTrigger>
						<AdventureSaveSheet
							finalFocus={
								mapInputAvailable
									? restoreMapFocus
										? mapRef
										: undefined
									: false
							}
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
							if (!open && mapInputAvailable)
								mapRef.current?.focus({ preventScroll: true });
						}}
					>
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<Settings aria-hidden="true" focusable="false" />
							Settings
						</SheetTrigger>
						<DungeonSettings
							finalFocus={mapInputAvailable ? mapRef : false}
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
							finalFocus={mapInputAvailable ? mapRef : false}
							monsters={activeMonsters}
							visible={
								fogConfiguration.enabled ? exploration.visible : undefined
							}
						/>
					</Sheet>
				}
				catalogAction={
					APP_FEATURES.developerCatalog && (
						<Sheet open={catalogOpen} onOpenChange={setCatalogOpen}>
							<SheetTrigger render={<Button type="button" variant="outline" />}>
								<LibraryBig aria-hidden="true" />
								Catalog
							</SheetTrigger>
							<Suspense fallback={null}>
								<DeveloperCatalog
									finalFocus={mapInputAvailable ? mapRef : false}
								/>
							</Suspense>
						</Sheet>
					)
				}
			/>

			<main className="flex min-h-0 min-w-0 flex-1 p-4 sm:p-6">
				<section
					aria-label="Adventure"
					data-low-health={isLowHealth(player)}
					className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-card p-3 sm:p-4"
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
							gold={game.state.gold}
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
						dungeonObjects={activeObjects}
						onInteractRequested={
							gameplayEnabled ? handleInteractRequested : undefined
						}
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
					<ObjectContext
						state={game.state}
						visible={fogConfiguration.enabled ? exploration.visible : undefined}
					/>
					<ActivityLog history={game.state.activityHistory} />
				</section>
			</main>
			<GameOverDialog
				state={game.state}
				open={deathOpen}
				onDismiss={() => setDismissedDeath(true)}
				onNewDungeon={handleNewDungeon}
				onReplay={() => {
					if (startRun(run.seed, configuration))
						mapRef.current?.focus({ preventScroll: true });
				}}
				mapRef={mapRef}
			/>
			<ObjectChoiceDialog
				object={interactionObject}
				targets={interactionTargets}
				onSelect={selectInteractionObject}
				onClose={() => {
					setInteractionObject(null);
					setInteractionTargets([]);
				}}
				onChoose={handleActionRequested}
				mapRef={mapRef}
			/>
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
