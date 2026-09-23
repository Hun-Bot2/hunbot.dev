// Validates internal-coherence invariants of the private Research OS's
// wire/storage contract (contracts/research-os/research-item.schema.json)
// against itself and against the two places in this repository that must
// stay in step with it. This is T10's specification for "Group 2" and
// "Group 3" of docs/decisions/research-os-data-contract.md's
// "Validator Invariants, Checkable Today" — INV-05 through INV-13, and
// INV-15. (INV-01..INV-04 and INV-14 live in scripts/validate-library.mjs
// and scripts/validate-product-boundaries.mjs respectively — they are
// content/code checks, not contract-file checks.)
//
// DECISION (research-os-data-contract.md, "Validator Invariants, Checkable
// Today"): this validator does not perform full JSON Schema validation and
// adds no ajv-class dependency. It parses the contract as JSON and checks
// structural invariants by hand. That keeps it dependency-free, which is
// the only reason it can run on every push.
//
// Idiom matches scripts/validate-library.mjs and scripts/validate-taxonomy.mjs:
// no dependencies beyond Node built-ins (plus the one pure TS module below),
// a flat array of collected error strings thrown together at the end.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// Imported by its real repo-relative path, matching
// scripts/validate-library.mjs's import of src/data/discoverFacets.ts — this
// repository's Node version strips TypeScript syntax natively, so plain
// `node scripts/validate-research-contract.mjs` can import a .ts module
// directly. Because import specifiers resolve relative to THIS file's own
// path (not process.cwd()), this always exercises the real implementation —
// including when the test harness runs this script with a fixture directory
// as cwd (test/helpers/validator-harness.mjs). That is deliberate: INV-12
// and INV-13 are checks that the real code matches a (possibly
// fixture-mutated) contract, not checks on a fixture copy of the code.
import { computeContentHash, CONTENT_HASH_FIELDS } from '../src/utils/canonicalization.ts';

const root = process.cwd();
const schemaPath = join(root, 'contracts/research-os/research-item.schema.json');
const schemaRaw = readFileSync(schemaPath, 'utf8');

const errors = [];

let schema;
try {
	schema = JSON.parse(schemaRaw);
} catch (error) {
	// INV-05, first half: the contract file must parse as JSON at all.
	throw new Error(`contracts/research-os/research-item.schema.json is not valid JSON: ${error.message}`);
}

const xContract = schema['x-contract'] ?? {};
const defs = schema['$defs'] ?? {};
const envelope = defs.envelope;

// ---------------------------------------------------------------------------
// INV-05 — the envelope declares contractVersion as a required, const-pinned
// integer.
// ---------------------------------------------------------------------------

if (!envelope) {
	errors.push('INV-05: $defs.envelope is missing from the contract file.');
} else {
	if (!Array.isArray(envelope.required) || !envelope.required.includes('contractVersion')) {
		errors.push('INV-05: $defs.envelope.required must include "contractVersion".');
	}

	const contractVersionProp = envelope.properties?.contractVersion;
	if (!contractVersionProp || contractVersionProp.type !== 'integer' || typeof contractVersionProp.const === 'undefined') {
		errors.push(
			'INV-05: $defs.envelope.properties.contractVersion must declare type "integer" and a "const" pin — the envelope is closed precisely so a version bump is the only way its shape can change.',
		);
	}
}

// ---------------------------------------------------------------------------
// INV-06 — every messageType in the envelope's enum has a corresponding
// $defs payload body, and payloadVersion is required.
// ---------------------------------------------------------------------------

if (envelope) {
	if (!Array.isArray(envelope.required) || !envelope.required.includes('payloadVersion')) {
		errors.push('INV-06: $defs.envelope.required must include "payloadVersion".');
	}

	const messageTypes = envelope.properties?.messageType?.enum ?? [];
	const allOfBranches = Array.isArray(envelope.allOf) ? envelope.allOf : [];

	for (const messageType of messageTypes) {
		const branch = allOfBranches.find((entry) => entry?.if?.properties?.messageType?.const === messageType);

		if (!branch) {
			errors.push(
				`INV-06: messageType "${messageType}" has no corresponding envelope.allOf branch mapping it to a payload body.`,
			);
			continue;
		}

		const ref = branch.then?.properties?.payload?.['$ref'];
		const defName = typeof ref === 'string' && ref.startsWith('#/$defs/') ? ref.slice('#/$defs/'.length) : undefined;

		if (!defName || !defs[defName]) {
			errors.push(
				`INV-06: messageType "${messageType}" references payload $ref "${ref}", which has no corresponding $defs body.`,
			);
		}
	}
}

// ---------------------------------------------------------------------------
// INV-07 / INV-08 — generic walk over the whole contract file collecting
// every property that carries "x-side", by the key name it annotates.
// ---------------------------------------------------------------------------

const xSideOccurrences = [];

function collectXSideOccurrences(node, parentKey, path) {
	if (Array.isArray(node)) {
		node.forEach((item, index) => collectXSideOccurrences(item, parentKey, `${path}[${index}]`));
		return;
	}

	if (!node || typeof node !== 'object') {
		return;
	}

	if (typeof node['x-side'] !== 'undefined') {
		xSideOccurrences.push({
			name: parentKey,
			xSide: node['x-side'],
			hasMirrorOf: typeof node['x-mirrorOf'] !== 'undefined',
			path,
		});
	}

	for (const [key, child] of Object.entries(node)) {
		collectXSideOccurrences(child, key, `${path}.${key}`);
	}
}

collectXSideOccurrences(schema, '$root', '$');

// INV-07, first half: every x-side value must be one of x-contract.sides.
const validSides = new Set(Array.isArray(xContract.sides) ? xContract.sides : []);
for (const occurrence of xSideOccurrences) {
	if (!validSides.has(occurrence.xSide)) {
		errors.push(
			`INV-07: ${occurrence.path} declares x-side "${occurrence.xSide}", which is not one of x-contract.sides (${[...validSides].join(', ')}).`,
		);
	}
}

// INV-07, second half: no field name is assigned two different owners.
const ownersByName = new Map();
for (const occurrence of xSideOccurrences) {
	if (!ownersByName.has(occurrence.name)) {
		ownersByName.set(occurrence.name, new Set());
	}
	ownersByName.get(occurrence.name).add(occurrence.xSide);
}
for (const [name, owners] of ownersByName) {
	if (owners.size > 1) {
		errors.push(`INV-07: field name "${name}" is assigned more than one owner across the contract: ${[...owners].join(', ')}.`);
	}
}

// INV-08: every property with x-mirrorOf also declares x-side: "corpus" — a
// mirror whose owner is not corpus is a dangling field.
for (const occurrence of xSideOccurrences) {
	if (occurrence.hasMirrorOf && occurrence.xSide !== 'corpus') {
		errors.push(
			`INV-08: ${occurrence.path} declares x-mirrorOf but x-side is "${occurrence.xSide}", not "corpus" — a mirror's owner must always be corpus.`,
		);
	}
}

// ---------------------------------------------------------------------------
// INV-09 — x-contract.forbiddenInPublicProjection.fromT01 is EXACTLY T01's
// own never-in-projection list in docs/decisions/research-item-identity.md.
// The document and the machine file cannot drift.
// ---------------------------------------------------------------------------

const identityDocPath = join(root, 'docs/decisions/research-item-identity.md');
// The document is REQUIRED, not tolerated-if-absent.
//
// This previously skipped when the file was missing, so that a fixture could
// ship only the minimal slice it needed. The cost was that INV-09 would also go
// silent in the real repository if the document were ever moved or renamed —
// a check that disappears without a word is worse than one that fails, because
// nothing distinguishes "passing" from "not running". Fixtures are generated
// from the real repository now (test/helpers/contract-fixture.mjs) and supply
// this file, so the tolerance buys nothing.
const identityDoc = existsSync(identityDocPath) ? readFileSync(identityDocPath, 'utf8') : null;

if (identityDoc === null) {
	errors.push(
		`INV-09: docs/decisions/research-item-identity.md is missing at ${identityDocPath}. It is the source of truth this invariant compares the contract against; without it the check cannot run, and a check that silently does not run is indistinguishable from one that passes.`,
	);
} else {
	// The declaring sentence names T10 explicitly (by design — it IS this
	// validator's specification), which is what makes it findable without
	// hardcoding the whole paragraph here.
	const enforcementLineMatch = identityDoc.match(
		/Fields that must never appear in the public projection[^\n]*T10-boundary-validator-hardening\.md\)([^\n]*)/,
	);

	if (!enforcementLineMatch) {
		errors.push(
			'INV-09: could not find the "Fields that must never appear in the public projection" enforcement sentence in docs/decisions/research-item-identity.md — has it moved or been reworded? Update this check\'s anchor pattern alongside it.',
		);
	} else {
		const docList = [...enforcementLineMatch[1].matchAll(/`([a-zA-Z0-9]+)`/g)].map((match) => match[1]);
		const contractList = Array.isArray(xContract.forbiddenInPublicProjection?.fromT01)
			? xContract.forbiddenInPublicProjection.fromT01
			: [];

		const docSet = new Set(docList);
		const contractSet = new Set(contractList);

		const missingFromContract = docList.filter((name) => !contractSet.has(name));
		const missingFromDoc = contractList.filter((name) => !docSet.has(name));

		if (missingFromContract.length > 0 || missingFromDoc.length > 0) {
			errors.push(
				'INV-09: x-contract.forbiddenInPublicProjection.fromT01 has drifted from T01\'s own never-in-projection list in research-item-identity.md. ' +
					`In the doc but not the contract: [${missingFromContract.join(', ')}]. In the contract but not the doc: [${missingFromDoc.join(', ')}].`,
			);
		}
	}
}

// ---------------------------------------------------------------------------
// INV-10 — x-contract.sizeBudget.hotItem: declared attribute bytes sum to
// declaredTotal, and declaredTotal <= maxBytes. Arithmetic, not prose.
// ---------------------------------------------------------------------------

const hotItem = xContract.sizeBudget?.hotItem;
if (!hotItem) {
	errors.push('INV-10: x-contract.sizeBudget.hotItem is missing.');
} else {
	const attributeBytes = Object.values(hotItem.attributes ?? {});
	const sum = attributeBytes.reduce((total, value) => total + value, 0);

	if (sum !== hotItem.declaredTotal) {
		errors.push(
			`INV-10: x-contract.sizeBudget.hotItem attribute bytes sum to ${sum}, but declaredTotal is ${hotItem.declaredTotal}. The size model must be exact arithmetic.`,
		);
	}

	if (typeof hotItem.maxBytes === 'number' && hotItem.declaredTotal > hotItem.maxBytes) {
		errors.push(
			`INV-10: x-contract.sizeBudget.hotItem.declaredTotal (${hotItem.declaredTotal}) exceeds maxBytes (${hotItem.maxBytes}).`,
		);
	}
}

// ---------------------------------------------------------------------------
// INV-11 — $defs.personalStateItem's property set EQUALS
// x-contract.sizeBudget.hotItem.attributes' key set.
// ---------------------------------------------------------------------------

const personalStateItemDef = defs.personalStateItem;
if (!personalStateItemDef || !hotItem) {
	errors.push('INV-11: cannot compare $defs.personalStateItem.properties to x-contract.sizeBudget.hotItem.attributes — one or both are missing.');
} else {
	const propertyNames = new Set(Object.keys(personalStateItemDef.properties ?? {}));
	const attributeNames = new Set(Object.keys(hotItem.attributes ?? {}));

	const propsWithoutBudget = [...propertyNames].filter((name) => !attributeNames.has(name));
	const budgetWithoutProp = [...attributeNames].filter((name) => !propertyNames.has(name));

	if (propsWithoutBudget.length > 0 || budgetWithoutProp.length > 0) {
		errors.push(
			'INV-11: $defs.personalStateItem.properties and x-contract.sizeBudget.hotItem.attributes must name exactly the same fields. ' +
				`Properties with no budget line: [${propsWithoutBudget.join(', ')}]. Budget lines with no property: [${budgetWithoutProp.join(', ')}].`,
		);
	}
}

// ---------------------------------------------------------------------------
// INV-12 — src/utils/canonicalization.ts's CONTENT_HASH_FIELDS equals
// x-contract.contentHash.fields, IN ORDER. Catches drift between T06's code
// and this contract — the most valuable check in the list, per the decision
// record: nothing else would notice a field silently added to the hash
// input, and that edit would invalidate every stored embedding while
// leaving both files individually correct.
// ---------------------------------------------------------------------------

const declaredContentHashFields = Array.isArray(xContract.contentHash?.fields) ? xContract.contentHash.fields : [];
const actualContentHashFields = [...CONTENT_HASH_FIELDS];

if (JSON.stringify(actualContentHashFields) !== JSON.stringify(declaredContentHashFields)) {
	errors.push(
		`INV-12: src/utils/canonicalization.ts's CONTENT_HASH_FIELDS is [${actualContentHashFields.join(', ')}], but x-contract.contentHash.fields is [${declaredContentHashFields.join(', ')}]. These must match, in order.`,
	);
}

// ---------------------------------------------------------------------------
// INV-13 — computeContentHash({}) matches x-contract.contentHash.pattern.
// Executable, not asserted.
// ---------------------------------------------------------------------------

const contentHashPattern = xContract.contentHash?.pattern;
if (!contentHashPattern) {
	errors.push('INV-13: x-contract.contentHash.pattern is missing.');
} else {
	const sample = computeContentHash({});
	const patternRegex = new RegExp(contentHashPattern);

	if (!patternRegex.test(sample)) {
		errors.push(
			`INV-13: computeContentHash({}) produced "${sample}", which does not match x-contract.contentHash.pattern (${contentHashPattern}).`,
		);
	}
}

// ---------------------------------------------------------------------------
// INV-15 — no name in x-contract.singleUser.forbiddenPrincipalFieldNames
// appears anywhere in the contract file OUTSIDE that declaration itself.
// ---------------------------------------------------------------------------

const forbiddenPrincipalNames = Array.isArray(xContract.singleUser?.forbiddenPrincipalFieldNames)
	? xContract.singleUser.forbiddenPrincipalFieldNames
	: [];
const declarationPattern = /"forbiddenPrincipalFieldNames"\s*:\s*\[[^\]]*\]/;
const declarationMatch = schemaRaw.match(declarationPattern);

if (!declarationMatch) {
	errors.push(
		'INV-15: could not locate the forbiddenPrincipalFieldNames declaration itself in the contract file — has its shape changed? Update this check\'s pattern alongside it.',
	);
} else {
	const restOfFile = schemaRaw.slice(0, declarationMatch.index) + schemaRaw.slice(declarationMatch.index + declarationMatch[0].length);

	for (const name of forbiddenPrincipalNames) {
		if (restOfFile.includes(`"${name}"`)) {
			errors.push(
				`INV-15: "${name}" appears in contracts/research-os/research-item.schema.json outside its forbiddenPrincipalFieldNames declaration. The single-user assumption (docs/decisions/research-os-cloud-architecture.md#security-boundary) forbids any principal identifier field.`,
			);
		}
	}
}

// ---------------------------------------------------------------------------

if (errors.length > 0) {
	throw new Error(`Invalid Research OS contract:\n- ${errors.join('\n- ')}`);
}

console.log(
	'Validated Research OS contract invariants: INV-05, INV-06, INV-07, INV-08, INV-09, INV-10, INV-11, INV-12, INV-13, INV-15.',
);
