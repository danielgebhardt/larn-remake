import { useState } from "react";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import Header from "./Header.tsx";
import {
	type Coordinate,
	type Dungeon,
	generateDungeon,
	selectPlayerStart,
} from "./LayoutTiles.ts";

type DungeonLayoutType = {
	terrain: Dungeon;
	startingPlayerPosition: Coordinate;
	seed: number;
	generation: number;
};

const Home = () => {
	const [{ terrain, startingPlayerPosition, generation }, setDungeon] =
		useState((): DungeonLayoutType => {
			const generated = generateDungeon(
				{
					rows: 30,
					cols: 100,
					minPartitionSize: 5,
					roomPadding: 1,
				},
				0,
			);

			return {
				terrain: generated.terrain,
				startingPlayerPosition: selectPlayerStart(generated),
				seed: 0,
				generation: 0,
			};
		});

	const handleNewDungeon = () => {
		const seed = Math.floor(Math.random() * 1000);
		const generated = generateDungeon(
			{
				rows: 30,
				cols: 100,
				minPartitionSize: 5,
				roomPadding: 1,
			},
			seed,
		);

		setDungeon((previous) => ({
			terrain: generated.terrain,
			startingPlayerPosition: selectPlayerStart(generated),
			seed,
			generation: previous.generation + 1,
		}));
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
					<DungeonLayout
						key={generation}
						dungeon={terrain}
						startingPlayerPosition={startingPlayerPosition}
					/>
				</section>
			</main>
		</div>
	);
};

export default Home;
