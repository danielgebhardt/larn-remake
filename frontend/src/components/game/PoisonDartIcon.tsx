import type { SVGProps } from "react";

const PoisonDartIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<path d="M9 2h6v5l4 4v9a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-9l4-4ZM9 5h6" />
		<path
			d="M9 13a3 3 0 1 1 6 0v1l-1 1v2h-4v-2l-1-1ZM12 15v2M8 19l8 2m-8 0 8-2"
			strokeWidth="1.3"
		/>
		<circle cx="10.8" cy="12.5" r=".65" fill="currentColor" stroke="none" />
		<circle cx="13.2" cy="12.5" r=".65" fill="currentColor" stroke="none" />
	</svg>
);
export default PoisonDartIcon;
