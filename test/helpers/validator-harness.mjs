// Shared helper for testing scripts/*.mjs validators against fixtures under
// test/fixtures/. See test/fixtures/README.md for the fixture convention.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Runs a validator script as a child process with its cwd set to
 * `fixtureDir`, so a validator that reads e.g. `src/content/blog` reads
 * `<fixtureDir>/src/content/blog` instead of the real repo root.
 *
 * @param {string} scriptPath - validator script path, relative to the repo root
 *   (e.g. 'scripts/validate-blog-content.mjs').
 * @param {string} fixtureDir - absolute path to the fixture case directory.
 * @returns {{status: number|null, stdout: string, stderr: string}}
 */
export function runValidator(scriptPath, fixtureDir) {
	return spawnSync(process.execPath, [join(repoRoot, scriptPath)], {
		cwd: fixtureDir,
		encoding: 'utf8',
	});
}

/**
 * Asserts that a validator run against `fixtureDir` fails: a non-zero exit
 * code AND output (stdout + stderr) matching `messagePattern`. Checking the
 * message, not just the exit code, keeps this from passing when the
 * validator crashed for an unrelated reason (e.g. a typo in the fixture path).
 *
 * @param {string} scriptPath - validator script path, relative to the repo root.
 * @param {string} fixtureDir - absolute path to the fixture case directory.
 * @param {RegExp} messagePattern - pattern the failure output must match.
 */
export function assertValidatorRejects(scriptPath, fixtureDir, messagePattern) {
	const result = runValidator(scriptPath, fixtureDir);
	const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

	assert.notEqual(
		result.status,
		0,
		`Expected ${scriptPath} to fail against ${fixtureDir}, but it exited 0.\nOutput:\n${output}`,
	);
	assert.match(
		output,
		messagePattern,
		`Expected ${scriptPath}'s failure output to match ${messagePattern}.\nOutput:\n${output}`,
	);
}
