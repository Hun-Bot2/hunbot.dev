// Validates the public artifact contract (contracts/public-artifact/) and
// everything published through it:
//
//   1. the JSON Schema and src/data/publicArtifactVocabulary.ts list the same
//      values (drift between the normative document and the code fails here);
//   2. Hun-Bot's own export, built by the real adapters
//      (src/utils/artifacts/adapters.ts) from the collections on disk;
//   3. the Research OS export, when src/data/research-os-export/public-artifacts.json
//      exists (absent is a normal state — Hun-Bot builds without it);
//   4. both together: ids unique across producers, every relation's endpoints
//      public, kind pairs and time order valid, no unverified relation.
//
// Growth counters are printed for information. They never gate anything
// (docs/plans/2026-10-03-explore-living-atlas.md, decision D4).
//
// `--print` writes Hun-Bot's normalized export and the adapter report as JSON
// to stdout instead, for review.
//
// Idiom matches the other validators: Node built-ins plus the shared pure TS
// modules, errors collected and thrown together.

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { artifactDomainOverrides } from '../src/data/artifactDomains.ts';
import { artifactDomains } from '../src/data/publicArtifactVocabulary.ts';
import { buildHunbotArtifactExport } from '../src/utils/artifacts/adapters.ts';
import { checkSchemaMatchesVocabulary, validateArtifactExports } from '../src/utils/artifacts/validate.ts';
import { readArtifactSources } from './lib/read-artifact-sources.mjs';

const root = process.cwd();
const SCHEMA_PATH = 'contracts/public-artifact/public-artifact.schema.json';
const RESEARCH_OS_EXPORT_PATH = 'src/data/research-os-export/public-artifacts.json';

const errors = [];
const warnings = [];

// 1. schema ⇄ vocabulary
const schema = readJson(SCHEMA_PATH, { required: true });
if (schema) errors.push(...checkSchemaMatchesVocabulary(schema).map((problem) => `${SCHEMA_PATH}: ${problem}`));

// 2. Hun-Bot export from the real adapters
const sources = readArtifactSources(root);
const { export: hunbotExport, report } = buildHunbotArtifactExport(sources);

if (process.argv.includes('--print')) {
	process.stdout.write(`${JSON.stringify({ export: hunbotExport, report }, null, 2)}\n`);
	process.exit(0);
}

for (const id of report.unusedOverrides) {
	errors.push(`src/data/artifactDomains.ts: artifactDomainOverrides["${id}"] matches no published artifact.`);
}
for (const [id, domain] of Object.entries(artifactDomainOverrides)) {
	if (!artifactDomains.includes(domain)) errors.push(`src/data/artifactDomains.ts: override "${id}" has unknown domain "${domain}".`);
}
for (const [category, count] of Object.entries(report.unmappedCategories)) {
	warnings.push(`blog category "${category}" (${count} published) has no entry in blogCategoryDomains; using the writing default domain.`);
}
for (const relation of report.withheldRelations) {
	warnings.push(`withheld ${relation.from} -${relation.rel}-> ${relation.to}: ${relation.reason}.`);
}
for (const { id, language, spellings } of report.inconsistentSeries) {
	warnings.push(`series "${id}" is spelled ${spellings.length} ways in ${language} (${spellings.map((name) => JSON.stringify(name)).join(', ')}); linked as one series, but worth making consistent in frontmatter.`);
}
for (const { artifact, topic } of report.unresolvedTopics) {
	warnings.push(`${artifact}: topic "${topic}" does not resolve to an active topic and was left out.`);
}

// 3 + 4. validate every export as one public set
const exportsToValidate = [{ label: 'hunbot (adapters)', value: hunbotExport }];
const researchOsExport = readJson(RESEARCH_OS_EXPORT_PATH, { required: false });
if (researchOsExport !== undefined) exportsToValidate.push({ label: RESEARCH_OS_EXPORT_PATH, value: researchOsExport });

const result = validateArtifactExports(exportsToValidate, { topics: sources.topics });
errors.push(...result.errors);
warnings.push(...result.warnings);

if (warnings.length > 0) {
	console.warn(`Public artifact warnings:\n- ${warnings.join('\n- ')}`);
}

if (errors.length > 0) {
	throw new Error(`Invalid public artifacts:\n- ${errors.join('\n- ')}`);
}

console.log(
	[
		`Validated public artifacts (contract v${hunbotExport.contractVersion}):`,
		`  artifacts  ${result.artifacts.length} — ${countBy(result.artifacts, (artifact) => artifact.kind)}`,
		`  domains    ${countBy(result.artifacts, (artifact) => artifact.domain, artifactDomains)}`,
		`  series     ${seriesSummary(result.artifacts)}`,
		`  relations  ${result.relations.length}${result.relations.length ? ` — ${countBy(result.relations, (relation) => relation.rel)}` : ''} (${report.withheldRelations.length} withheld)`,
		`  aggregates ${result.aggregates.length}`,
		`  since ${firstDate(result.artifacts) ?? '—'} · last added ${lastAdded(result.artifacts) ?? '—'}`,
		`  Research OS export: ${researchOsExport === undefined ? 'absent' : 'present'}`,
	].join('\n'),
);

function readJson(path, { required }) {
	const fullPath = join(root, path);
	if (!existsSync(fullPath)) {
		if (required) errors.push(`${path} is missing.`);
		return undefined;
	}
	try {
		return JSON.parse(readFileSync(fullPath, 'utf8'));
	} catch (error) {
		errors.push(`${path} is not valid JSON: ${error.message}`);
		return null;
	}
}

function countBy(items, key, order) {
	const counts = new Map((order ?? []).map((value) => [value, 0]));
	for (const item of items) counts.set(key(item), (counts.get(key(item)) ?? 0) + 1);
	return [...counts].map(([value, count]) => `${value} ${count}`).join(', ');
}

function seriesSummary(artifacts) {
	const sizes = new Map();
	for (const artifact of artifacts) {
		if (artifact.series) sizes.set(artifact.series.id, (sizes.get(artifact.series.id) ?? 0) + 1);
	}
	const standalone = artifacts.filter((artifact) => !artifact.series).length;
	return `${sizes.size} series (${[...sizes.values()].filter((size) => size > 1).length} with more than one artifact), ${standalone} standalone`;
}

function firstDate(artifacts) {
	return artifacts.map((artifact) => artifact.time.start).sort()[0];
}

function lastAdded(artifacts) {
	return artifacts.map((artifact) => artifact.addedAt).sort().at(-1);
}
