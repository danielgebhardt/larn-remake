import { type SubmitEvent, useState } from "react";
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
import Header from "./Header.tsx";
import type { Coordinate, DungeonConfig } from "./LayoutTiles.ts";
import { MAX_SEED, parseSeedInput } from "./Seed.ts";

const dungeonConfig: DungeonConfig = {
	rows: 30,
	cols: 100,
	minPartitionSize: 5,
	roomPadding: 1,
};

const createRun = (seed: number): DungeonRun =>
	connectDungeonFloors(generateDungeonRun(seed, 3, dungeonConfig));

const Home = () => {
	const [run, setRun] = useState<DungeonRun>(() => createRun(0));
	const [seedInput, setSeedInput] = useState(() => String(run.seed));
	const [seedError, setSeedError] = useState<string | null>(null);

	const activeFloor = run.floors[run.activeFloor - 1];

	const handleNewDungeon = () => {
		const seed = Math.floor(Math.random() * (MAX_SEED + 1));

		setRun(createRun(seed));
		setSeedInput(String(seed));
		setSeedError(null);
	};

	const handleSeedSubmit = (event: SubmitEvent<HTMLFormElement>) => {
		event.preventDefault();
		const seed = parseSeedInput(seedInput);
		if (seed === undefined) {
			setSeedError(`Enter a whole number from 0 to ${MAX_SEED}.`);
			return;
		}
		setRun(createRun(seed));
		setSeedInput(String(seed));
		setSeedError(null);
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
		<div>
			<Header
				floorNumber={activeFloor.floorNumber}
				floorCount={run.floors.length}
				onNewDungeon={handleNewDungeon}
			/>

			<main>
				<section>
					<APICheck />
				</section>

				<section className="grid gap-2">
					<p>
						Seed: <output aria-label="Current dungeon seed">{run.seed}</output>
					</p>
					<form
						className="flex flex-wrap items-center justify-center gap-2"
						onSubmit={handleSeedSubmit}
					>
						<label htmlFor="dungeon-seed">Dungeon seed</label>
						<input
							id="dungeon-seed"
							className="rounded border px-2 py-1"
							type="text"
							inputMode="numeric"
							value={seedInput}
							aria-invalid={seedError !== null}
							aria-describedby={seedError ? "seed-error" : undefined}
							onChange={(event) => {
								setSeedInput(event.target.value);
								setSeedError(null);
							}}
						/>
						<button type="submit">Start from seed</button>
						{seedError && (
							<p id="seed-error" role="alert" className="w-full">
								{seedError}
							</p>
						)}
					</form>
				</section>

				<section>
					<DungeonLegend />
					<DungeonLayout
						dungeon={activeFloor.terrain}
						playerPosition={run.playerCoordinate}
						upStair={activeFloor.upStair?.coordinate}
						downStair={activeFloor.downStair?.coordinate}
						onPlayerMove={handlePlayerMove}
					/>
				</section>
			</main>
		</div>
	);
};

export default Home;
