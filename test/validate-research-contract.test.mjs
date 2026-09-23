// Regression tests for scripts/validate-research-contract.mjs — T10's
// implementation of Group 2 and Group 3 of
// docs/decisions/research-os-data-contract.md's "Validator Invariants,
// Checkable Today" (INV-05..INV-13, INV-15).
//
// Each fixture is the REAL contract plus exactly one mutation, generated at
// test time (test/helpers/contract-fixture.mjs). Committed copies were replaced
// on 2026-09-16: they cost ~11,000 lines, and being stored copies they would
// silently become fixtures of an obsolete contract shape the moment the real
// one changed — still passing, no longer meaningful.
import test from 'node:test';

import { assertValidatorAccepts, assertValidatorRejects } from './helpers/validator-harness.mjs';
import { withMutatedContract, repoRoot } from './helpers/contract-fixture.mjs';

const VALIDATOR = 'scripts/validate-research-contract.mjs';

const rejects = (mutate, pattern) =>
	withMutatedContract(mutate, (dir) => assertValidatorRejects(VALIDATOR, dir, pattern));

test('validate-research-contract accepts the real contract file', () => {
	assertValidatorAccepts(VALIDATOR, repoRoot);
});

test('rejects an envelope.contractVersion missing its const pin (INV-05)', () => {
	rejects(
		(s) => { delete s.$defs.envelope.properties.contractVersion.const; },
		/INV-05: \$defs\.envelope\.properties\.contractVersion must declare type "integer" and a "const" pin/,
	);
});

test('rejects a messageType with no payload $defs body (INV-06)', () => {
	rejects(
		(s) => { s.$defs.envelope.properties.messageType.enum.push('candidate.orphaned'); },
		/INV-06: messageType "candidate\.orphaned" has no corresponding envelope\.allOf branch mapping it to a payload body/,
	);
});

test('rejects an x-side value outside x-contract.sides (INV-07)', () => {
	rejects(
		(s) => { s.$defs.itemId['x-side'] = 'not-a-real-side'; },
		/INV-07: \$\.\$defs\.itemId declares x-side "not-a-real-side", which is not one of x-contract\.sides/,
	);
});

test('rejects a field name assigned two different x-side owners (INV-07)', () => {
	rejects(
		(s) => { s.$defs.itemId['x-side'] = 'operational'; },
		/INV-07: field name "itemId" is assigned more than one owner across the contract: operational, corpus/,
	);
});

test('rejects a mirror (x-mirrorOf) whose x-side is not corpus (INV-08)', () => {
	rejects(
		(s) => { s.$defs.personalStateItem.properties.titleMirror['x-side'] = 'personal-state'; },
		/INV-08: .*titleMirror declares x-mirrorOf but x-side is "personal-state", not "corpus"/,
	);
});

test('rejects forbiddenInPublicProjection.fromT01 drifting from research-item-identity.md (INV-09)', () => {
	rejects(
		(s) => {
			const list = s['x-contract'].forbiddenInPublicProjection.fromT01;
			list.splice(list.indexOf('conflicts'), 1);
		},
		/INV-09: x-contract\.forbiddenInPublicProjection\.fromT01 has drifted from T01's own never-in-projection list.*In the doc but not the contract: \[conflicts\]/,
	);
});

test('rejects a size-budget attribute sum that does not equal declaredTotal (INV-10)', () => {
	rejects(
		(s) => { s['x-contract'].sizeBudget.hotItem.declaredTotal = 999; },
		/INV-10: x-contract\.sizeBudget\.hotItem attribute bytes sum to 815, but declaredTotal is 999/,
	);
});

test('rejects personalStateItem properties diverging from the size-budget attribute set (INV-11)', () => {
	rejects(
		(s) => { delete s.$defs.personalStateItem.properties.gsi1sk; },
		/INV-11: .*Budget lines with no property: \[gsi1sk\]/,
	);
});

test('rejects x-contract.contentHash.fields drifting from CONTENT_HASH_FIELDS (INV-12)', () => {
	// The most valuable check in the list per the decision record: nothing else
	// would notice a field silently added to the hash input, and the change would
	// invalidate every stored hash while leaving both files individually correct.
	rejects(
		(s) => { s['x-contract'].contentHash.fields.push('keywords'); },
		/INV-12: src\/utils\/canonicalization\.ts's CONTENT_HASH_FIELDS is \[title, abstract, authors, venue, year\], but x-contract\.contentHash\.fields is \[title, abstract, authors, venue, year, keywords\]/,
	);
});

test('rejects computeContentHash({}) not matching the declared pattern (INV-13)', () => {
	rejects(
		(s) => { s['x-contract'].contentHash.pattern = '^v2:sha256:[0-9a-f]{64}$'; },
		/INV-13: computeContentHash\(\{\}\) produced "v1:sha256:[0-9a-f]{64}", which does not match x-contract\.contentHash\.pattern/,
	);
});

test('rejects a forbidden principal field name leaking outside its declaration (INV-15)', () => {
	rejects(
		(s) => { s.$defs.producer.properties.userId = { type: 'string' }; },
		/INV-15: "userId" appears in contracts\/research-os\/research-item\.schema\.json outside its forbiddenPrincipalFieldNames declaration/,
	);
});
