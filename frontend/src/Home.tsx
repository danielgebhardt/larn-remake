import { Settings } from "lucide-react";
import { type SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger } from "@/components/ui/sheet";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import DungeonLegend from "./DungeonLegend.tsx";
import {
	ascendDungeonRun,
	connectDungeonFloors,
	type DungeonRun,
	descendDungeonRun,
	generateDungeonRun,
} from "./DungeonRun.ts";
import DungeonSettings from "./DungeonSettings.tsx";
import Header from "./Header.tsx";
import type { Coordinate } from "./LayoutTiles.ts";
import {
	type ConfigurationErrors,
	configurationDraft,
	DEFAULT_RUN_CONFIGURATION,
	parseRunConfiguration,
	type RunConfiguration,
} from "./RunConfiguration";
import { MAX_SEED, parseSeedInput } from "./Seed.ts";

const createRun = (seed: number, configuration: RunConfiguration): DungeonRun =>
	connectDungeonFloors(
		generateDungeonRun(seed, configuration.floorCount, {
			rows: configuration.rows,
			cols: configuration.cols,
			minPartitionSize: 5,
			roomPadding: 1,
		}),
	);

const Home = () => {
	const [run, setRun] = useState<DungeonRun>(() =>
		createRun(0, DEFAULT_RUN_CONFIGURATION),
	);
	const [configuration, setConfiguration] = useState(DEFAULT_RUN_CONFIGURATION);
	const [configDraft, setConfigDraft] = useState(() =>
		configurationDraft(DEFAULT_RUN_CONFIGURATION),
	);
	const [configErrors, setConfigErrors] = useState<ConfigurationErrors>({});
	const [generationError, setGenerationError] = useState<string | null>(null);
	const [seedInput, setSeedInput] = useState(() => String(run.seed));
	const [seedError, setSeedError] = useState<string | null>(null);
	const [settingsOpen, setSettingsOpen] = useState(false);

	const activeFloor = run.floors[run.activeFloor - 1];
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
		setRun(nextRun);
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
		const parsed = parseRunConfiguration(configDraft);
		setSeedError(
			seed === undefined ? `Enter a whole number from 0 to ${MAX_SEED}.` : null,
		);
		setConfigErrors(parsed.valid ? {} : parsed.errors);
		setGenerationError(null);
		if (seed === undefined || !parsed.valid) return;
		if (startRun(seed, parsed.value)) setSettingsOpen(false);
	};

	const handlePlayerMove = (coordinate: Coordinate) => {
		setRun((current) => {
			const movedRunCheckDescend = descendDungeonRun({
				...current,
				playerCoordinate: coordinate,
			});

			if (movedRunCheckDescend.transitioned) {
				return movedRunCheckDescend.run;
			}

			const movedRunCheckAscend = ascendDungeonRun({
				...current,
				playerCoordinate: coordinate,
			});

			return movedRunCheckAscend.run;
		});
	};

	return (
		<Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
			<div className="flex min-h-svh flex-col bg-muted/30">
				<Header
					floorNumber={activeFloor.floorNumber}
					floorCount={run.floors.length}
					onNewDungeon={handleNewDungeon}
					settingsAction={
						<SheetTrigger render={<Button type="button" variant="outline" />}>
							<Settings aria-hidden="true" focusable="false" />
							Settings
						</SheetTrigger>
					}
				/>

				<main className="min-w-0 flex-1 space-y-4 p-4 sm:p-6">
					<section className="min-w-0 rounded-lg border border-border bg-card p-3 sm:p-4">
						<DungeonLegend />
						<DungeonLayout
							dungeon={activeFloor.terrain}
							playerPosition={run.playerCoordinate}
							upStair={activeFloor.upStair?.coordinate}
							downStair={activeFloor.downStair?.coordinate}
							onPlayerMove={handlePlayerMove}
							movementEnabled={!settingsOpen}
						/>
					</section>
				</main>
				<footer className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-border px-4 py-2 text-xs text-muted-foreground sm:px-6">
					<span>Server:</span>
					<APICheck />
				</footer>
				<DungeonSettings
					seed={run.seed}
					seedInput={seedInput}
					seedError={seedError}
					configuration={configuration}
					configDraft={configDraft}
					configErrors={configErrors}
					generationError={generationError}
					onConfigInputChange={(field, value) => {
						setConfigDraft((current) => ({ ...current, [field]: value }));
						setConfigErrors((current) => ({ ...current, [field]: undefined }));
						setGenerationError(null);
					}}
					onSeedInputChange={(value) => {
						setSeedInput(value);
						setSeedError(null);
						setGenerationError(null);
					}}
					onSeedSubmit={handleSeedSubmit}
				/>
			</div>
		</Sheet>
	);
};

export default Home;
