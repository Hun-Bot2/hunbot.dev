// Generates a contract fixture at test time instead of committing a copy.
//
// scripts/validate-research-contract.mjs reads the contract from
// `process.cwd()`, so a fixture is a directory containing one mutated copy.
// Committing those copies cost ~11,000 lines across eleven directories, and —
// worse than the size — they were STORED copies of a shape that keeps evolving.
// When the real contract changes, a stored fixture becomes a copy of an
// obsolete shape that still passes, so the suite goes on proving something
// about a contract the repository no longer has.
//
// Generating from the real file each run makes that impossible: a fixture is,
// by construction, the current contract plus exactly one stated mutation.

import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
export const repoRoot = join(here, '..', '..');
const CONTRACT_RELATIVE = 'contracts/research-os/research-item.schema.json';

// Files the validator reads from the repository root besides the contract.
// INV-09 compares the contract against this document, and the validator now
// treats it as required rather than skipping when absent — so every generated
// fixture must carry it.
const COPIED_ALONGSIDE = ['docs/decisions/research-item-identity.md'];

export function readRealContract() {
	return JSON.parse(readFileSync(join(repoRoot, CONTRACT_RELATIVE), 'utf8'));
}

/**
 * Applies `mutate` to a fresh parse of the real contract, writes the result into
 * a temporary directory shaped like the repository, and hands that directory to
 * `run`. The directory is always removed, including when `run` throws.
 *
 * `mutate` must actually change something — a fixture that silently mutates
 * nothing would make its test assert that the *real* contract is invalid, which
 * is a confusing way to discover a typo in a property path.
 */
export function withMutatedContract(mutate, run) {
	const schema = readRealContract();
	const before = JSON.stringify(schema);
	mutate(schema);
	const after = JSON.stringify(schema);
	if (before === after) {
		throw new Error('the fixture mutation changed nothing — check the property path');
	}

	const dir = mkdtempSync(join(tmpdir(), 'contract-fixture-'));
	try {
		mkdirSync(join(dir, dirname(CONTRACT_RELATIVE)), { recursive: true });
		writeFileSync(join(dir, CONTRACT_RELATIVE), `${JSON.stringify(schema, null, '\t')}\n`);
		for (const relative of COPIED_ALONGSIDE) {
			mkdirSync(join(dir, dirname(relative)), { recursive: true });
			copyFileSync(join(repoRoot, relative), join(dir, relative));
		}
		return run(dir);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
}
