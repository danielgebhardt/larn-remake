import "./App.css";
import { useState } from "react";
import AdventureOpening from "./components/game/AdventureOpening";
import { MAX_SEED } from "./domain/dungeon/Seed";
import { type RestoredAdventure, restoreSave } from "./domain/saves/SaveFormat";
import Home from "./Home.tsx";
import { ThemeProvider } from "./settings/ThemeProvider.tsx";

function App() {
	const [adventure, setAdventure] = useState<
		{ seed: number } | { restored: RestoredAdventure } | null
	>(null);
	return (
		<ThemeProvider>
			{adventure === null ? (
				<AdventureOpening
					onRestore={(document) =>
						setAdventure({ restored: restoreSave(document) })
					}
					onBegin={() =>
						setAdventure({ seed: Math.floor(Math.random() * (MAX_SEED + 1)) })
					}
				/>
			) : (
				<Home
					initialSeed={"seed" in adventure ? adventure.seed : undefined}
					initialAdventure={
						"restored" in adventure ? adventure.restored : undefined
					}
				/>
			)}
		</ThemeProvider>
	);
}

export default App;
