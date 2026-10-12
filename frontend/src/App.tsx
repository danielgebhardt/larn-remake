import "./App.css";
import { useState } from "react";
import AdventureOpening from "./components/game/AdventureOpening";
import { MAX_SEED } from "./domain/dungeon/Seed";
import Home from "./Home.tsx";
import { ThemeProvider } from "./settings/ThemeProvider.tsx";

function App() {
	const [seed, setSeed] = useState<number | null>(null);
	return (
		<ThemeProvider>
			{seed === null ? (
				<AdventureOpening
					onBegin={() => setSeed(Math.floor(Math.random() * (MAX_SEED + 1)))}
				/>
			) : (
				<Home initialSeed={seed} />
			)}
		</ThemeProvider>
	);
}

export default App;
