import { DEFAULT_RUN_CONFIGURATION } from "../domain/dungeon/RunConfiguration";

// Keep focused regression scenarios small and stable when the recommended run changes.
export const COMPACT_TEST_CONFIGURATION = {
	...DEFAULT_RUN_CONFIGURATION,
	rows: 15,
	cols: 15,
	floorCount: 5,
};
