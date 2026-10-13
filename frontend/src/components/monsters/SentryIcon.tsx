import type { SVGProps } from "react";

const SentryIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M5 9V6l4-3 4 3v3M5 9h8v6l-4 3-4-3ZM7 11h1m2 0h1M3 22v-2l6-2 5 2v2M16 12v-2a3 3 0 0 1 6 0v2l1 3h-8l1-3Zm2 5h2M19 5V3" />
	</svg>
);
export default SentryIcon;
