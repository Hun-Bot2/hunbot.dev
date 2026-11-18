// The sent copy for layer 3: numbered units of the sections that rules did not cover (contracts.md "Sent copy").
import type { Note } from './note.ts';
import { sha256 } from './text.ts';

export type Payload = { sourceId: string; text: string; unitIds: string[]; sections: number[]; hash: string };

export function buildPayload(note: Note, used: Set<string>): Payload | null {
	const lines: string[] = [];
	const unitIds: string[] = [];
	const sections: number[] = [];
	for (const section of note.sections) {
		const remaining = section.units.filter((id) => !used.has(id));
		if (!remaining.length) continue;
		sections.push(section.index);
		const level = '#'.repeat(Math.min(Math.max(section.depth, 1), 6));
		lines.push(`${level} ${section.heading}`);
		for (const id of remaining) {
			const unit = note.units.get(id);
			if (!unit) continue;
			unitIds.push(id);
			if (unit.kind === 'C') lines.push(`[${id}] \`\`\`${unit.lang ?? ''}\n${unit.text}\n\`\`\``);
			else if (unit.kind === 'M') lines.push(`[${id}] $$\n${unit.text}\n$$`);
			else lines.push(`[${id}] ${unit.text}`);
		}
		lines.push('');
	}
	if (!unitIds.length) return null;
	const text = lines.join('\n').trim() + '\n';
	return { sourceId: note.sourceId, text, unitIds, sections, hash: sha256(text) };
}
