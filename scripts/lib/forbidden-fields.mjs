// Field names that never appear in the exported, owner-reviewed records of the
// Library (explainers, signals, weekly notes), each with the reason shown on
// failure. Shared by scripts/validate-explainers.mjs, validate-signals.mjs and
// validate-weekly.mjs so the lists cannot drift apart.
//
// The contract file's own forbidden lists
// (contracts/research-os/research-item.schema.json `x-contract`) apply too; that
// file is vendored byte-for-byte by the private repository, so this module
// reads it and never edits it.

import { readFileSync } from 'node:fs';

export const forbiddenByReason = [
	{
		reason: 'quotes from the source are not published — the record is commentary in its own words',
		names: ['quote', 'quotes', 'quoted', 'quotedtext', 'sourcequote', 'sourcequotes', 'excerpt', 'excerpts', 'passage', 'passages', 'verbatim'],
	},
	{
		reason: 'model names, costs and token counts are pipeline internals',
		names: ['model', 'modelname', 'modelid', 'models', 'llm', 'provider', 'cost', 'costs', 'price', 'tokens', 'tokencount', 'inputtokens', 'outputtokens', 'usage', 'prompt', 'prompts', 'temperature'],
	},
	{
		reason: 'verification-check results are pipeline internals',
		names: ['verification', 'verifications', 'verificationchecks', 'verificationresult', 'verificationresults', 'checks', 'checkresults', 'factcheck', 'factchecks', 'validation', 'validationresults'],
	},
	{
		reason: 'private signals and scores never leave the private pipeline',
		names: ['signals', 'signal', 'privatesignals', 'score', 'scores', 'rank', 'ranking', 'pipeline', 'pipelinestage', 'rights', 'rightsdecision', 'license', 'licensing'],
	},
];

const contract = JSON.parse(
	readFileSync(new URL('../../contracts/research-os/research-item.schema.json', import.meta.url), 'utf8'),
)['x-contract'];

/** lower-case name -> reason. */
export const forbiddenReasons = new Map();
for (const name of [
	...contract.forbiddenInPublicProjection.fromT01,
	...contract.forbiddenInPublicProjection.addedByT02,
	...contract.personalStateFieldNames.names,
	...contract.removedScoreFields.names,
]) {
	forbiddenReasons.set(name.toLowerCase(), 'a private Research OS field that is never part of a public projection');
}
for (const { reason, names } of forbiddenByReason) {
	for (const name of names) forbiddenReasons.set(name, reason);
}

/**
 * Allowlist check for one object: reports a forbidden name with its reason,
 * and any other unlisted name as not allowed. `skip` names are ignored here
 * (the caller validates them itself).
 */
export function checkFieldNames(object, allowedKeys, path, { noun, doc, skip = [] }) {
	const errors = [];
	for (const key of Object.keys(object)) {
		if (skip.includes(key)) continue;
		const reason = forbiddenReasons.get(key.toLowerCase());
		if (reason) {
			errors.push(`${path}.${key} is a forbidden field in ${noun}: ${reason}.`);
		} else if (!allowedKeys.has(key)) {
			errors.push(`${path}.${key} is not an allowed ${noun.replace(/^an? /, '')} field (the schema is an allowlist; see ${doc}).`);
		}
	}
	return errors;
}

/**
 * A forbidden name hidden deeper than the allowlisted objects (inside a value
 * that should be a string, in an array item) is still caught. `minDepth` counts
 * path segments below `label`.
 */
export function scanForbiddenDeep(value, label, { noun, minDepth = 3, skipPaths = [] }) {
	const errors = [];
	const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
	const scan = (node, path) => {
		if (Array.isArray(node)) {
			node.forEach((item, index) => scan(item, `${path}[${index}]`));
		} else if (isObject(node)) {
			for (const [key, child] of Object.entries(node)) {
				const childPath = `${path}.${key}`;
				const depth = childPath.slice(label.length).split('.').length - 1;
				if (!skipPaths.includes(childPath) && depth >= minDepth && forbiddenReasons.has(key.toLowerCase())) {
					errors.push(`${childPath} is a forbidden field in ${noun}: ${forbiddenReasons.get(key.toLowerCase())}.`);
				}
				scan(child, childPath);
			}
		}
	};
	scan(value, label);
	return errors;
}
