import type { SVGProps } from "react";

const TreasureChestIcon = ({
	opened = false,
	...props
}: SVGProps<SVGSVGElement> & { opened?: boolean }) => (
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
		<title>{opened ? "Opened treasure chest" : "Treasure chest"}</title>
		{opened ? (
			<path d="m3 8 4-5h14l-4 5H3Zm0 0v4" />
		) : (
			<path d="M3 12V8a5 5 0 0 1 5-5h8a5 5 0 0 1 5 5v4" />
		)}
		<rect
			x="3"
			y="12"
			width="18"
			height="9"
			rx="1"
			fill="currentColor"
			fillOpacity=".08"
		/>
		<path d="M7 12v9m10-9v9" />
		<rect x="10" y="11" width="4" height="6" rx="1" />
		<path d="M12 14v1" />
	</svg>
);
export const OpenedTreasureChestIcon = (props: SVGProps<SVGSVGElement>) => (
	<TreasureChestIcon opened {...props} />
);
export default TreasureChestIcon;
