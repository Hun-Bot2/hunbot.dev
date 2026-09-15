// Regression tests for scripts/validate-product-boundaries.mjs. Previously
// untested by any fixture — this file's first case (INV-14, T10) is also
// this validator's first regression test.
//
// Unlike scripts/validate-library.mjs, this validator is assertion-based
// (each `assert.*` throws immediately) rather than error-collecting, so a
// fixture reaching a check partway through the script must also satisfy
// every assertion that runs before it: a matching package.json script entry,
// exactly the two approved API routes, and a feedback route that itself
// passes its own checks.
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, 'fixtures/validate-product-boundaries');
const repoRoot = join(here, '..');

test('validate-product-boundaries accepts the real repository', () => {
	assertValidatorAccepts('scripts/validate-product-boundaries.mjs', repoRoot);
});

test('validate-product-boundaries rejects a public page importing src/utils/canonicalization.ts (INV-14)', () => {
	// docs/decisions/research-os-data-contract.md, INV-14: the public site
	// must gain no runtime dependency on the private Research OS pipeline.
	assertValidatorRejects(
		'scripts/validate-product-boundaries.mjs',
		join(fixturesRoot, 'pages-file-imports-canonicalization'),
		/fixture-page\.astro imports "\.\.\/\.\.\/utils\/canonicalization\.ts" — must not import contracts\/ or src\/utils\/canonicalization\.ts/,
	);
});
