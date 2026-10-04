// What the Atlas legend ("읽는 법") explains. It always says the three things
// every visitor needs — what horizontal position, rows, and a selected mark
// mean — and nothing else unless it is currently meaningful:
//
//   - 'relations': lines are drawn only when public relations exist;
//   - 'types': glyph shapes only differ when more than one artifact kind is
//     present.
//
// The recently-added overline is not explained here; the growth summary above
// the chart already says how many artifacts were added in the last 30 days.

export type LegendOptional = 'relations' | 'types';

export function getLegendOptionals(input: { relationCount: number; kindCount: number }): LegendOptional[] {
	return [
		input.relationCount > 0 ? ('relations' as const) : null,
		input.kindCount > 1 ? ('types' as const) : null,
	].filter((entry): entry is LegendOptional => entry !== null);
}
