import type { SVGProps } from "react";

const GolemIcon = (props: SVGProps<SVGSVGElement>) => (
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
		<rect x="7" y="2" width="10" height="8" rx="1" />
		<path d="M10 5h.1M14 5h.1M9 8h6M5 12h14v8H5ZM2 12v9m20-9v9M8 20v3m8-3v3M12 12v8M5 16h14" />
	</svg>
);
export default GolemIcon;
