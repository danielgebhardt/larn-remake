import { useState } from "react";
import APICheck from "./APICheck.tsx";
import DungeonLayout from "./DungeonLayout.tsx";
import Header from "./Header.tsx";
import { generateDungeon, selectPlayerStart } from "./LayoutTiles.ts";

const Home = () => {
	const [{ terrain, startingPlayerPosition }] = useState(() => {
		const generated = generateDungeon({
			rows: 12,
			cols: 20,
			minPartitionSize: 5,
			roomPadding: 1,
		});

		return {
			terrain: generated.terrain,
			startingPlayerPosition: selectPlayerStart(generated),
		};
	});

	return (
		<div>
			<Header />
			<main>
				<section>
					<APICheck />
				</section>
				<section>
					<DungeonLayout
						dungeon={terrain}
						startingPlayerPosition={startingPlayerPosition}
					/>
				</section>
			</main>
		</div>
	);
};

export default Home;
