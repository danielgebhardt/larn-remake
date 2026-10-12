import type { SVGProps } from "react";

const NecromancerIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="m12 2-7 9-2 11h18l-2-11ZM8 11h8v5l-2 2h-4l-2-2ZM10 13h.1m4 0h.1M10 17v-2m4 2v-2" />
	</svg>
);
export default NecromancerIcon;
