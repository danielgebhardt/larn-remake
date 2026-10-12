import type { SVGProps } from "react";

const CultistIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="m12 2-7 9-2 11h18l-2-11ZM8 11h8l-1 5H9ZM10 12h.1M14 12h.1M7 20h10" />
	</svg>
);
export default CultistIcon;
