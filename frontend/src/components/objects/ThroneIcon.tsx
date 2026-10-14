import type { SVGProps } from "react";

const ThroneIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<title>Ancient throne</title>
		<path d="M7 14V4l3 2 2-4 2 4 3-2v10" />
		<path d="M3 12h4v5h10v-5h4v8H3Zm4 2h10M5 20v2m14-2v2" />
	</svg>
);
export default ThroneIcon;
