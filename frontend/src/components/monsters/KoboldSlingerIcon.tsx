import type { SVGProps } from "react";

const KoboldSlingerIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="m3 7-2-4 6 2h4l5-2-2 5v7l-5 4-6-4ZM5 10h1m5 0h1M6 14h5M20 21v-7l-3-5m3 5 3-5" />
		<circle cx="20" cy="5" r="1.5" />
	</svg>
);
export default KoboldSlingerIcon;
