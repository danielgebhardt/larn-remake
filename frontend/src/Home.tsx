import { useState } from "react";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import {
	ascendDungeonRun,
	connectDungeonFloors,
	type DungeonRun,
	descendDungeonRun,
	generateDungeonRun,
} from "./DungeonRun.ts";
import Header from "./Header.tsx";
import type { Coordinate, DungeonConfig } from "./LayoutTiles.ts";

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

	const activeFloor = run.floors[run.activeFloor - 1];

	const handleNewDungeon = () => {
		const seed = Math.floor(Math.random() * 1000);

		setRun(createRun(seed));
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
			<Header />

			<main>
				<section>
					<APICheck />
				</section>

				<section>
					<button type="button" onClick={handleNewDungeon}>
						New Dungeon
					</button>
				</section>

				<section>
					<h2>
						Floor {activeFloor.floorNumber} of {run.floors.length}
					</h2>
				</section>

				<section>
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
