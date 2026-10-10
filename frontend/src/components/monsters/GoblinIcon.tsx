import type { SVGProps } from "react";

// Pointed ears, a heavy brow, and two small fangs stay legible at tile size.
const GoblinIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		aria-hidden="true"
		focusable="false"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="1.8"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<path d="M7 7 2 5l2 8 3 1M17 7l5-2-2 8-3 1" />
		<path d="M7 6q5-3 10 0v9q0 6-5 6t-5-6Z" />
		<path d="m8 10 3 1m5-1-3 1M9 16h6m-6 0 1 3 1-3m2 0 1 3 1-3" />
	</svg>
);

export default GoblinIcon;
