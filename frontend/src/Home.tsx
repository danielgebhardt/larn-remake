import { HelpCircleIcon, Settings, UserRound } from "lucide-react";
import { type SubmitEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import DungeonHelp from "@/settings/DungeonHelp.tsx";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./components/dungeon/DungeonLayout.tsx";
import DungeonLegend from "./components/dungeon/DungeonLegend.tsx";
import ActivityLog from "./components/game/ActivityLog.tsx";
import CharacterSheet from "./components/game/CharacterSheet.tsx";
import PlayerStatus from "./components/game/PlayerStatus.tsx";
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
import { createGameState } from "./domain/game/GameState.ts";
import {
	type PlayerAction,
	resolvePlayerAction,
} from "./domain/game/PlayerActions.ts";
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

type HomeProps = { initialFogConfiguration?: FogConfiguration };

const Home = ({
	initialFogConfiguration = DEFAULT_FOG_CONFIGURATION,
}: HomeProps) => {
	const [fogConfiguration, setFogConfiguration] = useState(
		initialFogConfiguration,
	);
	const [game, setGame] = useState(() => {
		const run = createRun(0, DEFAULT_RUN_CONFIGURATION);
		return {
			state: createGameState(run),
			exploration: updateExploration(run, fogConfiguration.radius),
		};
	});
	const { run, turn, player } = game.state;
	const { exploration } = game;
	const [configuration, setConfiguration] = useState(DEFAULT_RUN_CONFIGURATION);
	const [configDraft, setConfigDraft] = useState(() =>
		configurationDraft(DEFAULT_RUN_CONFIGURATION),
	);
	const [configErrors, setConfigErrors] = useState<ConfigurationErrors>({});
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [seedInput, setSeedInput] = useState(() => String(run.seed));
	const [seedError, setSeedError] = useState<string | null>(null);
	const [settingsOpen, setSettingsOpen] = useState(false);
	const [helpOpen, setHelpOpen] = useState(false);
	const [characterOpen, setCharacterOpen] = useState(false);

	const activeFloor = run.floors[run.activeFloor - 1];
	const activeMonsters = useMemo(
		() =>
			game.state.monsters.filter(
				(monster) =>
					monster.floorNumber === run.activeFloor && monster.health > 0,
			),
		[game.state.monsters, run.activeFloor],
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
		});
		setConfiguration(nextConfiguration);
		setConfigDraft(configurationDraft(nextConfiguration));
		setConfigErrors({});
		setGenerationError(null);
		setSeedInput(String(seed));
		setSeedError(null);
		return true;
	};

	const handleNewDungeon = () => {
		const seed = Math.floor(Math.random() * (MAX_SEED + 1));

		startRun(seed, configuration);
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
			if (!result.turnAdvanced) return current;
			return {
				state: result.state,
				exploration: updateExploration(
					result.state.run,
					fogConfiguration.radius,
					current.exploration,
				),
			};
		});
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

	return (
		<div className="flex h-dvh flex-col bg-muted/30">
			<Header
				floorNumber={activeFloor.floorNumber}
				floorCount={run.floors.length}
				onNewDungeon={handleNewDungeon}
				characterAction={
					<Sheet open={characterOpen} onOpenChange={setCharacterOpen}>
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<UserRound aria-hidden="true" focusable="false" />
							Character
						</SheetTrigger>
						<CharacterSheet
							player={player}
							equipment={game.state.equipment}
							bag={game.state.bag}
						/>
					</Sheet>
				}
				settingsAction={
					<Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<Settings aria-hidden="true" focusable="false" />
							Settings
						</SheetTrigger>
						<DungeonSettings
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
						<DungeonHelp />
					</Sheet>
				}
			/>

			<main className="flex min-h-0 min-w-0 flex-1 p-4 sm:p-6">
				<section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-lg border border-border bg-card p-3 sm:p-4">
					<PlayerStatus turn={turn} player={player} />
					<DungeonLegend fogEnabled={fogConfiguration.enabled} />
					<DungeonLayout
						monsters={activeMonsters}
						dungeon={activeFloor.terrain}
						visible={fogConfiguration.enabled ? exploration.visible : undefined}
						explored={
							fogConfiguration.enabled
								? exploration.explored.get(run.activeFloor)
								: undefined
						}
						playerPosition={run.playerCoordinate}
						upStair={activeFloor.upStair?.coordinate}
						downStair={activeFloor.downStair?.coordinate}
						onMoveRequested={(direction) =>
							handleActionRequested({ type: "move", direction })
						}
						onWaitRequested={() => handleActionRequested({ type: "wait" })}
						movementEnabled={
							!settingsOpen && !helpOpen && !characterOpen && player.health > 0
						}
					/>
					<ActivityLog history={game.state.activityHistory} />
				</section>
			</main>
			<footer className="flex shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-6">
				<span>Server:</span>
				<APICheck />
			</footer>
		</div>
	);
};

export default Home;
