// Phase 0 CLI: rules → preview → llm (with a confirmed digest) → blind sheet → score.
// Usage: node tools/study-engine/src/run.ts <command> [paths...] [--confirm <digest>]
// Paths default to src/content/blog/ko/study; anything outside <lang>/study/ is skipped (D11).
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { REPO_ROOT, STATE_DIR, loadEngineEnv } from './env.ts';
import { DEFAULT_SOURCE, collectFiles, isStudySource, readNote, type Note } from './note.ts';
import { extractRules } from './rules.ts';
import { buildPayload, type Payload } from './payload.ts';
import { PROMPT_VERSION, SCHEMA_VERSION, buildPrompt, responseSchema, validateOutput, type Prompt } from './llm.ts';
import { generateJson } from './gemini.ts';
import { SLOT_TYPES, attachFormulaChoices, conceptKey, type Card, type CardType } from './cards.ts';
import { sha256 } from './text.ts';

const PHASE0 = path.join(STATE_DIR, 'phase0');
const CACHE = path.join(STATE_DIR, 'cache');
const LOGS = path.join(STATE_DIR, 'logs');
const REFERENCES = path.join(REPO_ROOT, '.local', 'study-engine', 'phase0', 'references.yaml');

type Prepared = { note: Note; rules: ReturnType<typeof extractRules>; payload: Payload | null; prompt: Prompt | null; skip: string | null };

function writeJson(file: string, data: unknown): void {
	fs.mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
	fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n', { mode: 0o600 });
}
const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(file, 'utf8')) as T;

function args(): { command: string; paths: string[]; confirm: string | null } {
	const [command = 'help', ...rest] = process.argv.slice(2);
	const i = rest.indexOf('--confirm');
	const confirm = i >= 0 ? (rest[i + 1] ?? null) : null;
	const paths = rest.filter((a, idx) => !a.startsWith('--') && !(i >= 0 && idx === i + 1));
	return { command, paths, confirm };
}

function maxCards(env: Record<string, string>): number {
	const n = Number(env.STUDY_MAX_CARDS ?? 5);
	return Number.isInteger(n) && n > 0 && n <= 10 ? n : 5;
}

function prepare(paths: string[], max: number): Prepared[] {
	const inputs = paths.length ? paths : [path.join(REPO_ROOT, DEFAULT_SOURCE)];
	return collectFiles(inputs).map((file) => {
		const note = readNote(file, REPO_ROOT);
		if (!isStudySource(note.relPath)) {
			return { note, rules: { cards: [], used: new Set<string>(), issues: [] }, payload: null, prompt: null, skip: 'not a study note (decision D11: sources are study/ only)' };
		}
		const rules = extractRules(note, { headingBaseline: true });
		if (note.parseError) return { note, rules, payload: null, prompt: null, skip: `parse error: ${note.parseError}` };
		const anki = (note.frontmatter?.anki ?? {}) as Record<string, unknown>;
		if (anki.enabled === false) return { note, rules, payload: null, prompt: null, skip: 'anki.enabled: false' };
		const payload = buildPayload(note, rules.used);
		if (anki.send === false) return { note, rules, payload, prompt: null, skip: 'anki.send: false' };
		if (!payload) return { note, rules, payload: null, prompt: null, skip: 'nothing left after rules' };
		return { note, rules, payload, prompt: buildPrompt(payload, max), skip: null };
	});
}

function planDigest(items: Prepared[], model: string, max: number): string {
	const parts = items.filter((p) => p.prompt).map((p) => `${p.note.sourceId}\n${sha256((p.prompt as Prompt).system + '\n---\n' + (p.prompt as Prompt).user)}`);
	return sha256([model, PROMPT_VERSION, SCHEMA_VERSION, String(max), ...parts].join('\n')).slice(0, 12);
}

function cmdRules(paths: string[], env: Record<string, string>): void {
	const items = prepare(paths, maxCards(env));
	for (const p of items.filter((x) => x.skip?.startsWith('not a study note'))) console.log(`SKIP ${p.note.relPath}: ${p.skip}`);
	const notes = items.filter((p) => !p.skip?.startsWith('not a study note')).map((p) => ({ relPath: p.note.relPath, sourceId: p.note.sourceId, documentHash: p.note.documentHash, parseError: p.note.parseError, units: p.note.units.size, cards: p.rules.cards, issues: p.rules.issues }));
	writeJson(path.join(PHASE0, 'rules.json'), { createdAt: new Date().toISOString(), notes });
	for (const n of notes) {
		const byOrigin = n.cards.reduce<Record<string, number>>((m, c) => ((m[c.origin] = (m[c.origin] ?? 0) + 1), m), {});
		console.log(`${n.relPath}\n  ${n.parseError ? 'PARSE ERROR: ' + n.parseError : `units ${n.units}, cards ${n.cards.length} ${JSON.stringify(byOrigin)}`}${n.issues.length ? `, issues ${n.issues.length}` : ''}`);
	}
	console.log(`\nwrote ${path.relative(REPO_ROOT, path.join(PHASE0, 'rules.json'))}`);
}

function cmdPreview(paths: string[], env: Record<string, string>): void {
	const model = env.STUDY_GEMINI_MODEL ?? '';
	if (!model) throw new Error('STUDY_GEMINI_MODEL is not set in tools/study-engine/.env');
	const max = maxCards(env);
	const items = prepare(paths, max);
	const dir = path.join(PHASE0, 'preview');
	fs.rmSync(dir, { recursive: true, force: true });
	let chars = 0;
	for (const p of items) {
		if (p.skip) {
			console.log(`SKIP ${p.note.relPath}: ${p.skip}`);
			continue;
		}
		const file = path.join(dir, `${p.note.sourceId}.txt`);
		fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
		const prompt = p.prompt as Prompt;
		fs.writeFileSync(file, `=== system instruction ===\n${prompt.system}\n\n=== user message ===\n${prompt.user}\n`, { mode: 0o600 });
		chars += prompt.system.length + prompt.user.length;
		console.log(`SEND ${p.note.relPath} → ${p.note.sourceId} (${p.payload?.unitIds.length} units, note ${prompt.user.length} chars) ${path.relative(REPO_ROOT, file)}`);
	}
	const digest = planDigest(items, model, max);
	writeJson(path.join(PHASE0, 'plan.json'), { digest, model, promptVersion: PROMPT_VERSION, maxCards: max, notes: items.filter((p) => !p.skip).map((p) => p.note.relPath) });
	console.log(`\nprovider gemini, model ${model}, prompt ${PROMPT_VERSION}, schema ${SCHEMA_VERSION}, max ${max} cards/note`);
	console.log(`${items.filter((p) => !p.skip).length} calls planned, ${chars} characters total. Read the files above before sending.`);
	console.log(`plan digest: ${digest}   (run: llm <same paths> --confirm ${digest})`);
}

async function cmdLlm(paths: string[], confirm: string | null, env: Record<string, string>): Promise<void> {
	const model = env.STUDY_GEMINI_MODEL ?? '';
	const apiKey = env.GEMINI_API_KEY ?? '';
	if (!model || !apiKey) throw new Error('GEMINI_API_KEY and STUDY_GEMINI_MODEL must be set in tools/study-engine/.env');
	const max = maxCards(env);
	const items = prepare(paths, max);
	const digest = planDigest(items, model, max);
	if (!confirm || confirm !== digest) {
		console.error(`Not sent. The confirmed digest ${confirm ?? '(none)'} does not match the current plan ${digest}. Run preview, read it, then pass --confirm ${digest}.`);
		process.exitCode = 3;
		return;
	}
	const results: Array<Record<string, unknown>> = [];
	for (const p of items) {
		if (p.skip || !p.payload || !p.prompt) continue;
		const cacheKey = sha256([p.note.sourceId, p.note.documentHash, p.payload.hash, PROMPT_VERSION, SCHEMA_VERSION, 'gemini', model, String(max)].join('|'));
		const cacheFile = path.join(CACHE, `${cacheKey}.json`);
		let raw: unknown;
		let meta: Record<string, unknown>;
		if (fs.existsSync(cacheFile)) {
			const cached = readJson<{ raw: unknown; meta: Record<string, unknown> }>(cacheFile);
			raw = cached.raw;
			meta = { ...cached.meta, cacheHit: true };
		} else {
			const res = await generateJson({ apiKey, model, system: p.prompt.system, prompt: p.prompt.user, schema: responseSchema(max) });
			const log = { time: new Date().toISOString(), sourceId: p.note.sourceId, provider: 'gemini', model, promptVersion: PROMPT_VERSION, ok: res.ok, attempts: res.attempts, latencyMs: res.latencyMs, ...(res.ok ? { modelVersion: res.modelVersion, usage: res.usage, finishReason: res.finishReason } : { status: res.status, code: res.code, usage: res.usage }) };
			fs.mkdirSync(LOGS, { recursive: true, mode: 0o700 });
			fs.appendFileSync(path.join(LOGS, 'usage.jsonl'), JSON.stringify(log) + '\n', { mode: 0o600 });
			if (!res.ok) {
				console.log(`FAIL ${p.note.relPath}: ${res.code}${res.status ? ` (HTTP ${res.status})` : ''} after ${res.attempts} attempt(s)`);
				results.push({ relPath: p.note.relPath, sourceId: p.note.sourceId, error: res.code, cards: [] });
				continue;
			}
			raw = res.json;
			meta = { modelVersion: res.modelVersion, usage: res.usage, latencyMs: res.latencyMs, cacheHit: false };
			writeJson(cacheFile, { raw, meta });
		}
		const v = validateOutput(raw, p.note, p.payload, max, new Set(p.rules.cards.map((c) => c.cardKey)));
		results.push({ relPath: p.note.relPath, sourceId: p.note.sourceId, ...meta, fatal: v.fatal, rejected: v.rejected, concepts: v.conceptCount, cards: v.cards });
		console.log(`${v.fatal ? 'INVALID' : 'OK'} ${p.note.relPath}: ${v.conceptCount} concept(s) → ${v.cards.length} card(s)${v.rejected.length ? `, ${v.rejected.length} slot(s) rejected (${v.rejected.map((r) => r.reason).join('; ')})` : ''}${v.fatal ? ` — ${v.fatal}` : ''}${meta.cacheHit ? ' [cache]' : ''}`);
	}
	writeJson(path.join(PHASE0, 'llm.json'), { createdAt: new Date().toISOString(), model, promptVersion: PROMPT_VERSION, notes: results });
	console.log(`\nwrote ${path.relative(REPO_ROOT, path.join(PHASE0, 'llm.json'))}`);
}

function seededShuffle<T>(items: T[], seed: string): T[] {
	return items
		.map((item, i) => ({ item, k: sha256(seed + ':' + i) }))
		.sort((a, b) => a.k.localeCompare(b.k))
		.map((x) => x.item);
}
const cell = (s: string) => s.replace(/\t/g, ' ').replace(/\r?\n/g, ' ⏎ ');

function cmdSheet(): void {
	const rules = readJson<{ notes: Array<{ relPath: string; cards: Card[] }> }>(path.join(PHASE0, 'rules.json'));
	const llmFile = path.join(PHASE0, 'llm.json');
	const llm = fs.existsSync(llmFile) ? readJson<{ notes: Array<{ relPath: string; cards: Card[] }> }>(llmFile) : { notes: [] };
	const entries = rules.notes.flatMap((note) => [
		...note.cards.map((c) => ({ relPath: note.relPath, c, condition: 'A+B' as const })),
		...(llm.notes.find((x) => x.relPath === note.relPath)?.cards ?? []).map((c) => ({ relPath: note.relPath, c, condition: 'B' as const })),
	]);
	// Formula choices come from every formula concept in this run (D13).
	attachFormulaChoices(entries.map((e) => e.c));
	const rows: string[] = ['id\tnote\tslot\tconcept (edit to match your reference name)\tfront\tback\tlabel(keep|fix|drop)'];
	const key: Record<string, { relPath: string; origin: string; condition: 'A+B' | 'B'; cardKey: string; type: string; track: string }> = {};
	const md: string[] = ['# Phase 0 blind sheet', '', 'Label every card in labels.tsv. The condition is hidden.', ''];
	let n = 0;
	for (const relPath of [...new Set(entries.map((e) => e.relPath))]) {
		md.push(`## ${relPath}`, '');
		for (const { c, condition } of seededShuffle(entries.filter((e) => e.relPath === relPath), relPath)) {
			n += 1;
			const id = `c${String(n).padStart(3, '0')}`;
			key[id] = { relPath, origin: c.origin, condition, cardKey: c.cardKey, type: c.type, track: c.track };
			rows.push([id, relPath, c.type, cell(c.concept), cell(c.front), cell(c.back), ''].join('\t'));
			md.push(`**${id}** · ${c.type} · ${c.concept}`, '', c.front, '', '↓', '', c.back, '', '---', '');
		}
	}
	fs.mkdirSync(PHASE0, { recursive: true, mode: 0o700 });
	fs.writeFileSync(path.join(PHASE0, 'labels.tsv'), rows.join('\n') + '\n', { mode: 0o600 });
	fs.writeFileSync(path.join(PHASE0, 'sheet.md'), md.join('\n'), { mode: 0o600 });
	writeJson(path.join(PHASE0, 'key.json'), key);
	console.log(`${n} cards → ${path.relative(REPO_ROOT, path.join(PHASE0, 'sheet.md'))} and labels.tsv (key.json holds the hidden conditions; do not open it before labelling)`);
}

/** references.yaml (D13): concept names and the slots I need for each. */
type Reference = { notes: Array<{ path: string; concepts: Array<{ name: string; aliases?: string[]; expect: CardType[] }> }> };

function cmdScore(): void {
	if (!fs.existsSync(REFERENCES)) throw new Error(`write your reference concepts first: ${path.relative(REPO_ROOT, REFERENCES)}`);
	const refs = YAML.parse(fs.readFileSync(REFERENCES, 'utf8')) as Reference;
	const key = readJson<Record<string, { relPath: string; condition: 'A+B' | 'B'; type: CardType }>>(path.join(PHASE0, 'key.json'));
	const labels = fs.readFileSync(path.join(PHASE0, 'labels.tsv'), 'utf8').trim().split('\n').slice(1).map((line) => {
		const [id, , slot, concept, , , label] = line.split('\t');
		return { id, slot: slot as CardType, concept: (concept ?? '').trim(), label: (label ?? '').trim() };
	});
	const unlabeled = labels.filter((l) => !['keep', 'fix', 'drop'].includes(l.label));
	if (unlabeled.length) console.log(`warning: ${unlabeled.length} card(s) without a valid label are counted as drop`);
	const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}% (${a}/${b})` : 'n/a');
	const out: string[] = ['| Condition | Cards | Hit rate | Slot coverage | ' + SLOT_TYPES.join(' | ') + ' |', '| --- | --- | --- | --- |' + SLOT_TYPES.map(() => ' --- |').join('')];
	for (const condition of ['A', 'B'] as const) {
		const inCond = labels.filter((l) => key[l.id] && (condition === 'B' || key[l.id].condition === 'A+B'));
		const hits = inCond.filter((l) => l.label === 'keep' || l.label === 'fix');
		const perSlot = Object.fromEntries(SLOT_TYPES.map((t) => [t, { got: 0, total: 0 }]));
		for (const note of refs.notes ?? []) {
			const rel = path.relative(REPO_ROOT, path.resolve(REPO_ROOT, note.path)).split(path.sep).join('/');
			const noteHits = hits.filter((l) => key[l.id].relPath === rel);
			for (const concept of note.concepts ?? []) {
				const names = new Set([concept.name, ...(concept.aliases ?? [])].map(conceptKey));
				for (const slot of concept.expect ?? []) {
					perSlot[slot].total += 1;
					if (noteHits.some((l) => l.slot === slot && names.has(conceptKey(l.concept)))) perSlot[slot].got += 1;
				}
			}
		}
		const got = SLOT_TYPES.reduce((s, t) => s + perSlot[t].got, 0);
		const total = SLOT_TYPES.reduce((s, t) => s + perSlot[t].total, 0);
		out.push(`| ${condition === 'A' ? 'A: rules only' : 'B: rules + LLM'} | ${inCond.length} | ${pct(hits.length, inCond.length)} | ${pct(got, total)} | ` + SLOT_TYPES.map((t) => pct(perSlot[t].got, perSlot[t].total)).join(' | ') + ' |');
	}
	const llmFile = path.join(PHASE0, 'llm.json');
	if (fs.existsSync(llmFile)) {
		const llm = readJson<{ notes: Array<{ cards: Card[]; rejected?: unknown[]; usage?: Record<string, number | null> }> }>(llmFile);
		const valid = llm.notes.reduce((s, n) => s + n.cards.length, 0);
		const rejected = llm.notes.reduce((s, n) => s + (n.rejected?.length ?? 0), 0);
		const tokens = (k: string) => llm.notes.map((n) => n.usage?.[k]).filter((v): v is number => typeof v === 'number');
		const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
		out.push('', `Slot validity (LLM): ${pct(valid, valid + rejected)}`);
		out.push(`Tokens reported in ${tokens('totalTokenCount').length}/${llm.notes.length} calls: input ${sum(tokens('promptTokenCount'))}, output ${sum(tokens('candidatesTokenCount'))}, thinking ${sum(tokens('thoughtsTokenCount'))}`);
	}
	const text = out.join('\n');
	fs.writeFileSync(path.join(PHASE0, 'results.md'), text + '\n', { mode: 0o600 });
	console.log(text);
}

async function main(): Promise<void> {
	const { command, paths, confirm } = args();
	const env = loadEngineEnv();
	switch (command) {
		case 'rules':
			return cmdRules(paths, env);
		case 'preview':
			return cmdPreview(paths, env);
		case 'llm':
			return cmdLlm(paths, confirm, env);
		case 'sheet':
			return cmdSheet();
		case 'score':
			return cmdScore();
		default:
			console.log('commands: rules <paths> | preview <paths> | llm <paths> --confirm <digest> | sheet | score');
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 1;
});
