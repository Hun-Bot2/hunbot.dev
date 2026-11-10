// Loads tools/study-engine/.env only. Never reads the blog's root .env (decisions D1, config.env.example).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ENGINE_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPO_ROOT = path.resolve(ENGINE_DIR, '..', '..');
export const STATE_DIR = path.join(REPO_ROOT, '.study-engine');

export function parseEnv(text: string): Record<string, string> {
	const out: Record<string, string> = {};
	for (const rawLine of text.split(/\r?\n/)) {
		const line = rawLine.trim();
		if (!line || line.startsWith('#')) continue;
		const eq = line.indexOf('=');
		if (eq <= 0) continue;
		const key = line.slice(0, eq).trim();
		let value = line.slice(eq + 1).trim();
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1);
		}
		out[key] = value;
	}
	return out;
}

export function loadEngineEnv(): Record<string, string> {
	const file = path.join(ENGINE_DIR, '.env');
	const fromFile = fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {};
	// Explicit process variables win, so a one-off run can override the file.
	const keys = ['GEMINI_API_KEY', 'STUDY_GEMINI_MODEL', 'STUDY_MAX_CARDS'];
	const merged: Record<string, string> = { ...fromFile };
	for (const key of keys) {
		if (process.env[key]) merged[key] = process.env[key] as string;
	}
	return merged;
}
