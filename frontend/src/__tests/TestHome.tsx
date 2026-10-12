import type { ComponentProps } from "react";
import Home from "../Home";
import { COMPACT_TEST_CONFIGURATION } from "./TestRunConfiguration";

// Most page tests exercise one interaction, not the size of the recommended adventure.
const TestHome = (props: ComponentProps<typeof Home>) => (
	<Home initialConfiguration={COMPACT_TEST_CONFIGURATION} {...props} />
);
export default TestHome;
