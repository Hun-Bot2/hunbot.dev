// Fixture: a minimal stand-in for src/content.config.ts declaring a field
// literally named `totalScore` in a Zod object shape. Proves INV-03's
// schema-side half — a removed ranking-input field must never reappear as
// an actual declared field, not merely be absent from content — independent
// of the real, much larger content.config.ts.
import { z } from 'astro:content';

const fixtureSchema = z.object({
	totalScore: z.number().nullable(),
});
