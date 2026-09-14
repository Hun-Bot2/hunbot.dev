import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidatorRejects } from './helpers/validator-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, 'fixtures/validate-blog-content');

test('validate-blog-content rejects a post missing a required frontmatter field', () => {
	assertValidatorRejects(
		'scripts/validate-blog-content.mjs',
		join(fixturesRoot, 'missing-required-field'),
		/missing required frontmatter field "title"/,
	);
});
