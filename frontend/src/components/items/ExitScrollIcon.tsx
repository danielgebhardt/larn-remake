import type { SVGProps } from "react";

const ExitScrollIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M6 4h12a2 2 0 0 1 2 2v13H8V6a2 2 0 1 0-4 0v2h4M8 19a2 2 0 0 0 2 2h10v-2" />
		<path d="M14 15V8m-3 3 3-3 3 3" />
	</svg>
);
export default ExitScrollIcon;
