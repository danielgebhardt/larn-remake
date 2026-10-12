// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mixedEncounter } from "../../src/__tests/TacticalReplayTestHelpers";
import { appendActivityEvents } from "../../src/domain/game/ActivityHistory";
import { resolvePlayerAction } from "../../src/domain/game/PlayerActions";
import {
	createReviewMetrics,
	observeReviewEquipment,
	recordReviewTurn,
	summarizeReviewMetrics,
} from "../review-metrics.mjs";

describe("Diagnostic combat and equipment counters", () => {
	it("counts actual travel and consecutive unchallenged movement without counting a bump attack", () => {
		const before = { ...mixedEncounter(), monsters: [], objects: [] };
		const first = {
			...before,
			run: { ...before.run, playerCoordinate: { row: 4, col: 5 } },
		};
		const second = {
			...first,
			run: { ...first.run, playerCoordinate: { row: 4, col: 6 } },
		};
		const metrics = createReviewMetrics();
		recordReviewTurn(
			metrics,
			before,
			{ type: "move", direction: "right" },
			first,
		);
		recordReviewTurn(
			metrics,
			first,
			{ type: "move", direction: "right" },
			second,
		);
		recordReviewTurn(
			metrics,
			second,
			{ type: "move", direction: "right" },
			second,
		);
		expect(metrics.travel).toMatchObject({
			moves: 2,
			unchallengedMoves: 2,
			longestQuietStreak: 2,
			currentQuietStreak: 0,
		});
	});
	it("records a useful pickup and upgrade without confusing them with final equipped slots", () => {
		const state = { ...mixedEncounter(), monsters: [] };
		state.floorItems = [
			{
				item: { id: "upgrade", kind: "iron-sword" },
				floorNumber: 4,
				coordinate: state.run.playerCoordinate,
			},
		];
		const pickedUp = resolvePlayerAction(state, {
			type: "pickup",
			itemId: "upgrade",
		}).state;
		const equipped = resolvePlayerAction(pickedUp, {
			type: "equip",
			itemId: "upgrade",
			slot: "mainHand",
		}).state;
		const metrics = createReviewMetrics();
		recordReviewTurn(
			metrics,
			state,
			{ type: "pickup", itemId: "upgrade" },
			pickedUp,
		);
		recordReviewTurn(
			metrics,
			pickedUp,
			{ type: "equip", itemId: "upgrade", slot: "mainHand" },
			equipped,
		);
		expect(metrics.equipmentReview).toMatchObject({
			pickedUp: { better: 1, same: 0, lower: 0 },
			upgrades: 1,
		});
		const result = {
			...metrics,
			equipment: equipped.equipment,
			initial: { monsters: [] },
		};
		expect(summarizeReviewMetrics([result]).equipmentReview).toEqual(
			metrics.equipmentReview,
		);
	});
	it("counts new shots, heavy attacks, avoided attacks, damage and kills exactly once", () => {
		const before = mixedEncounter();
		before.activityHistory = appendActivityEvents(before.activityHistory, [
			{ type: "monster-hit", monster: "goblin", damage: 1, turn: 1 },
		]);
		const after = {
			...before,
			activityHistory: appendActivityEvents(before.activityHistory, [
				{
					type: "monster-shot-hit",
					monster: "goblin-archer",
					damage: 2,
					turn: 2,
				},
				{
					type: "monster-heavy-hit",
					monster: "dungeon-brute",
					damage: 5,
					turn: 2,
				},
				{ type: "monster-heavy-avoided", monster: "dungeon-brute", turn: 2 },
				{
					type: "spell-hit",
					monster: "goblin",
					spell: "magic-missile",
					damage: 4,
					turn: 2,
				},
				{ type: "monster-died", monster: "goblin", turn: 2 },
			]),
		};
		const metrics = createReviewMetrics();
		recordReviewTurn(metrics, before, { type: "wait" }, after);
		expect(metrics.combat).toMatchObject({
			"monster-hit": 0,
			"monster-shot-hit": 1,
			"monster-heavy-hit": 1,
			"monster-heavy-avoided": 1,
			"spell-hit": 1,
		});
		expect(metrics.damage).toEqual({
			received: 7,
			dealt: 4,
			receivedByKind: { "goblin-archer": 2, "dungeon-brute": 5 },
		});
		expect(metrics.killsByKind).toEqual({ goblin: 1 });
	});
	it("classifies each active-floor gear copy once relative to gear equipped when first observed", () => {
		const state = mixedEncounter();
		state.floorItems = [
			{
				item: { id: "better", kind: "iron-sword" },
				floorNumber: 4,
				coordinate: { row: 2, col: 2 },
			},
			{
				item: { id: "same", kind: "short-sword" },
				floorNumber: 4,
				coordinate: { row: 2, col: 3 },
			},
			{
				item: { id: "off-floor", kind: "iron-sword" },
				floorNumber: 5,
				coordinate: { row: 2, col: 2 },
			},
		];
		const metrics = createReviewMetrics(),
			seen = new Set();
		observeReviewEquipment(metrics, state, seen);
		observeReviewEquipment(metrics, state, seen);
		expect(metrics.equipmentReview.observed).toEqual({
			better: 1,
			same: 1,
			lower: 0,
			tradeoff: 0,
		});
		expect(metrics.equipmentReview.pickedUp).toEqual({
			better: 0,
			same: 0,
			lower: 0,
			tradeoff: 0,
		});
	});
	it("aggregates tactical counts and actual initial mixtures across runs", () => {
		const run = {
			...createReviewMetrics(),
			initial: {
				monsters: [{ kind: "goblin-archer" }, { kind: "dungeon-brute" }],
			},
		};
		run.combat["monster-prepared"] = 3;
		run.combat["monster-heavy-avoided"] = 2;
		expect(summarizeReviewMetrics([run, run])).toMatchObject({
			combat: { "monster-prepared": 6, "monster-heavy-avoided": 4 },
			monsterMixture: { "goblin-archer": 2, "dungeon-brute": 2 },
		});
	});
});
