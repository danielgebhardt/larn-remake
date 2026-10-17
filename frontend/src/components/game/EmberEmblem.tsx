import emberEmblem from "@/assets/ember-emblem.png";

const EmberEmblem = ({ className = "" }: { className?: string }) => (
	<img
		src={emberEmblem}
		alt=""
		aria-hidden="true"
		draggable={false}
		className={`shrink-0 object-contain ${className}`}
	/>
);
export default EmberEmblem;
