import { type ComponentProps, useState } from "react";
import { createAdventureSession } from "../components/game/useAdventureSession";
import { DEFAULT_FOG_CONFIGURATION } from "../domain/dungeon/RunConfiguration";
import Home from "../Home";
import { COMPACT_TEST_CONFIGURATION } from "./TestRunConfiguration";

// Existing focused page scenarios begin inside the dungeon, as restored adventures do.
// Town start/travel scenarios render production Home/App with explicit live sessions.
const TestHome = (props: ComponentProps<typeof Home>) => {
	const [fixture] = useState(() => {
		if (props.initialAdventure) return props.initialAdventure;
		const fresh = createAdventureSession(
			props.initialSeed ?? 0,
			props.initialConfiguration ?? COMPACT_TEST_CONFIGURATION,
			props.initialFogConfiguration ?? DEFAULT_FOG_CONFIGURATION,
		);
		return { ...fresh, state: { ...fresh.state, town: null } };
	});
	return (
		<Home
			initialConfiguration={COMPACT_TEST_CONFIGURATION}
			{...props}
			initialAdventure={fixture}
		/>
	);
};
export default TestHome;
