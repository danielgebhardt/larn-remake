import type { SVGProps } from "react";

const MerchantIcon = (props: SVGProps<SVGSVGElement>) => (
	<svg
		aria-hidden="true"
		focusable="false"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		className="size-full text-item-gear"
		strokeLinecap="round"
		strokeLinejoin="round"
		{...props}
	>
		<title>Potion merchant shop</title>
		<path d="M2 3h3l3 13h11M6 6h16l-3 7H7" />
		<path d="M7 6h15l-3 7H8" fill="currentColor" fillOpacity=".12" />
		<circle cx="9" cy="20" r="1.3" fill="currentColor" />
		<circle cx="18" cy="20" r="1.3" fill="currentColor" />
	</svg>
);
export default MerchantIcon;
