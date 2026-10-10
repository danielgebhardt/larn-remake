import { memo, useCallback, useLayoutEffect, useRef } from "react";
import type { ActivityHistory } from "../../domain/game/ActivityHistory.ts";
import { formatActivityEvent } from "./ActivityMessages.ts";

const ActivityLog = memo(function ActivityLog({
	history,
}: {
	history: ActivityHistory;
}) {
	const viewportRef = useRef<HTMLDivElement>(null);
	const following = useRef(true);
	const anchor = useRef<{ id: string; offset: number } | undefined>(undefined);
	const rememberAnchor = useCallback(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		const top = viewport.getBoundingClientRect().top + viewport.clientTop;
		const entry = Array.from(
			viewport.querySelectorAll<HTMLElement>("[data-entry-id]"),
		).find((item) => item.getBoundingClientRect().bottom > top);
		anchor.current = entry
			? {
					id: entry.dataset.entryId ?? "",
					offset: entry.getBoundingClientRect().top - top,
				}
			: undefined;
	}, []);

	useLayoutEffect(() => {
		const viewport = viewportRef.current;
		if (!viewport) return;
		if (history.nextId === 0) {
			following.current = true;
			viewport.scrollTop = 0;
		} else if (following.current) {
			viewport.scrollTop = Math.max(
				0,
				viewport.scrollHeight - viewport.clientHeight,
			);
		} else if (anchor.current) {
			// Keep the same entry at the same offset even when old entries are trimmed.
			const previous = anchor.current;
			const entry = Array.from(
				viewport.querySelectorAll<HTMLElement>("[data-entry-id]"),
			).find((item) => item.dataset.entryId === previous.id);
			if (entry) {
				const top = viewport.getBoundingClientRect().top + viewport.clientTop;
				viewport.scrollTop +=
					entry.getBoundingClientRect().top - top - previous.offset;
			} else {
				viewport.scrollTop = 0;
			}
		}
		rememberAnchor();
	}, [history, rememberAnchor]);

	return (
		<section
			aria-labelledby="activity-title"
			className="mt-3 shrink-0 border-t pt-2"
		>
			<h2 id="activity-title" className="mb-1 text-sm font-medium">
				Activity
			</h2>
			<div
				ref={viewportRef}
				role="log"
				aria-label="Activity log"
				aria-live="polite"
				aria-relevant="additions"
				aria-atomic="false"
				// biome-ignore lint/a11y/noNoninteractiveTabindex: Keyboard users need to scroll the activity history.
				tabIndex={0}
				className="h-[clamp(3rem,14dvh,7rem)] overflow-y-auto rounded-md bg-muted/40 px-3 py-2 text-xs leading-5 [overflow-anchor:none] focus-visible:outline-2 focus-visible:outline-ring"
				onScroll={() => {
					const viewport = viewportRef.current;
					if (!viewport) return;
					following.current =
						viewport.scrollHeight -
							viewport.clientHeight -
							viewport.scrollTop <=
						2;
					rememberAnchor();
				}}
			>
				{history.entries.length === 0 ? (
					<p className="text-muted-foreground">No activity yet.</p>
				) : (
					<ol>
						{history.entries.map((entry) => (
							<li key={entry.id} data-entry-id={entry.id}>
								{formatActivityEvent(entry.event)}
							</li>
						))}
					</ol>
				)}
			</div>
		</section>
	);
});

export default ActivityLog;
