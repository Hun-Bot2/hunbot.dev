// Regression tests for scripts/validate-research-contract.mjs — T10's
// implementation of Group 2 and Group 3 of
// docs/decisions/research-os-data-contract.md's "Validator Invariants,
// Checkable Today" (INV-05..INV-13, INV-15).
//
// Each fixture is a full copy of the real
// contracts/research-os/research-item.schema.json with exactly one targeted
// mutation, generated from the real file rather than hand-typed, so a
// fixture never drifts from the shape the real contract actually has.
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesRoot = join(here, 'fixtures/validate-research-contract');
const repoRoot = join(here, '..');

test('validate-research-contract accepts the real contract file', () => {
	assertValidatorAccepts('scripts/validate-research-contract.mjs', repoRoot);
});

test('validate-research-contract rejects an envelope.contractVersion missing its const pin (INV-05)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'contract-version-not-const'),
		/INV-05: \$defs\.envelope\.properties\.contractVersion must declare type "integer" and a "const" pin/,
	);
});

test('validate-research-contract rejects a messageType with no payload $defs body (INV-06)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'message-type-missing-payload-defs'),
		/INV-06: messageType "candidate\.orphaned" has no corresponding envelope\.allOf branch mapping it to a payload body/,
	);
});

test('validate-research-contract rejects an x-side value outside x-contract.sides (INV-07)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'x-side-value-not-in-registry'),
		/INV-07: \$\.\$defs\.itemId declares x-side "not-a-real-side", which is not one of x-contract\.sides/,
	);
});

test('validate-research-contract rejects a field name assigned two different x-side owners (INV-07)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'field-name-two-owners'),
		/INV-07: field name "itemId" is assigned more than one owner across the contract: operational, corpus/,
	);
});

test('validate-research-contract rejects a mirror (x-mirrorOf) whose x-side is not corpus (INV-08)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'mirror-owner-not-corpus'),
		/INV-08: .*titleMirror declares x-mirrorOf but x-side is "personal-state", not "corpus"/,
	);
});

test('validate-research-contract rejects forbiddenInPublicProjection.fromT01 drifting from research-item-identity.md (INV-09)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'from-t01-drift'),
		/INV-09: x-contract\.forbiddenInPublicProjection\.fromT01 has drifted from T01's own never-in-projection list.*In the doc but not the contract: \[conflicts\]/,
	);
});

test('validate-research-contract rejects a size-budget attribute sum that does not equal declaredTotal (INV-10)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'size-budget-sum-mismatch'),
		/INV-10: x-contract\.sizeBudget\.hotItem attribute bytes sum to 815, but declaredTotal is 999/,
	);
});

test('validate-research-contract rejects personalStateItem properties diverging from the size-budget attribute set (INV-11)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'personal-state-item-property-budget-mismatch'),
		/INV-11: .*Budget lines with no property: \[gsi1sk\]/,
	);
});

test('validate-research-contract rejects x-contract.contentHash.fields drifting from CONTENT_HASH_FIELDS (INV-12)', () => {
	// The most valuable check in the list per the decision record: nothing
	// else would notice a field silently added to the hash input.
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'content-hash-fields-drift'),
		/INV-12: src\/utils\/canonicalization\.ts's CONTENT_HASH_FIELDS is \[title, abstract, authors, venue, year\], but x-contract\.contentHash\.fields is \[title, abstract, authors, venue, year, keywords\]/,
	);
});

test('validate-research-contract rejects computeContentHash({}) not matching the declared pattern (INV-13)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'content-hash-pattern-drift'),
		/INV-13: computeContentHash\(\{\}\) produced "v1:sha256:[0-9a-f]{64}", which does not match x-contract\.contentHash\.pattern/,
	);
});

test('validate-research-contract rejects a forbidden principal field name leaking outside its declaration (INV-15)', () => {
	assertValidatorRejects(
		'scripts/validate-research-contract.mjs',
		join(fixturesRoot, 'forbidden-principal-field-leaked'),
		/INV-15: "userId" appears in contracts\/research-os\/research-item\.schema\.json outside its forbiddenPrincipalFieldNames declaration/,
	);
});
