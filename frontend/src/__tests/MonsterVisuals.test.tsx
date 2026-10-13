// @vitest-environment node
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { MONSTER_VISUALS } from "../components/monsters/MonsterVisuals";

it("gives every monster its own silhouette, independent of color", () => {
	const seen = new Map<string, string>();
	for (const [kind, { icon: Icon }] of Object.entries(MONSTER_VISUALS)) {
		// Compare drawing content, excluding the SVG wrapper and descriptive title.
		const drawing = renderToStaticMarkup(<Icon />).replace(
			/<svg[^>]*>|<\/svg>|<title>.*?<\/title>/g,
			"",
		);
		expect(
			seen.get(drawing),
			`${kind} shares its silhouette with ${seen.get(drawing)}`,
		).toBeUndefined();
		seen.set(drawing, kind);
	}
});
