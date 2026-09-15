import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidatorRejects } from './helpers/validator-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, 'fixtures/validate-taxonomy');

test('validate-taxonomy rejects an unresolved parent', () => {
	assertValidatorRejects(
		'scripts/validate-taxonomy.mjs',
		join(fixturesRoot, 'unresolved-parent'),
		/parent references unknown topic id "nonexistent-parent"/,
	);
});

test('validate-taxonomy rejects a parent cycle', () => {
	assertValidatorRejects(
		'scripts/validate-taxonomy.mjs',
		join(fixturesRoot, 'cycle-parent'),
		/parent cycle/,
	);
});

test('validate-taxonomy rejects a mergedInto cycle', () => {
	assertValidatorRejects(
		'scripts/validate-taxonomy.mjs',
		join(fixturesRoot, 'cycle-merged-into'),
		/mergedInto cycle/,
	);
});

test('validate-taxonomy rejects duplicate topic ids', () => {
	assertValidatorRejects(
		'scripts/validate-taxonomy.mjs',
		join(fixturesRoot, 'duplicate-ids'),
		/Duplicate topic id "dup"/,
	);
});

test('validate-taxonomy rejects an alias declared by more than one topic', () => {
	assertValidatorRejects(
		'scripts/validate-taxonomy.mjs',
		join(fixturesRoot, 'duplicate-aliases'),
		/Alias "old-name" is declared by more than one topic/,
	);
});

test('validate-taxonomy rejects an alias that collides with another topic\'s id', () => {
	assertValidatorRejects(
		'scripts/validate-taxonomy.mjs',
		join(fixturesRoot, 'alias-collides-with-id'),
		/Alias "a" collides with the id of topic/,
	);
});

test('validate-taxonomy rejects an item referencing a non-active, non-merged topic', () => {
	assertValidatorRejects(
		'scripts/validate-taxonomy.mjs',
		join(fixturesRoot, 'item-references-non-active-topic'),
		/references topic "archived-topic".*neither active nor merged into an active topic/,
	);
});

test('validate-taxonomy rejects an archived topic with an active child', () => {
	assertValidatorRejects(
		'scripts/validate-taxonomy.mjs',
		join(fixturesRoot, 'archived-parent-active-child'),
		/is archived but has an active child/,
	);
});
