// Gemini REST adapter. Never logs the key, the prompt, or raw error bodies (privacy.md).
export type Usage = {
	promptTokenCount: number | null;
	candidatesTokenCount: number | null;
	thoughtsTokenCount: number | null;
	cachedContentTokenCount: number | null;
	totalTokenCount: number | null;
};
export type CallResult =
	| { ok: true; json: unknown; usage: Usage; modelVersion: string | null; latencyMs: number; attempts: number; finishReason: string | null }
	| { ok: false; status: number | null; code: string; latencyMs: number; attempts: number; usage: Usage | null };

const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models';

function pickUsage(meta: Record<string, unknown> | undefined): Usage {
	const n = (k: string) => (typeof meta?.[k] === 'number' ? (meta[k] as number) : null);
	return {
		promptTokenCount: n('promptTokenCount'),
		candidatesTokenCount: n('candidatesTokenCount'),
		thoughtsTokenCount: n('thoughtsTokenCount'),
		cachedContentTokenCount: n('cachedContentTokenCount'),
		totalTokenCount: n('totalTokenCount'),
	};
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function generateJson(opts: { apiKey: string; model: string; system: string; prompt: string; schema: Record<string, unknown>; maxAttempts?: number; timeoutMs?: number }): Promise<CallResult> {
	const maxAttempts = opts.maxAttempts ?? 3;
	const started = Date.now();
	let lastStatus: number | null = null;
	let lastCode = 'unknown';
	let attempts = 0;
	for (let attempt = 1; attempt <= maxAttempts; attempt++) {
		attempts = attempt;
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 120_000);
		try {
			const res = await fetch(`${ENDPOINT}/${encodeURIComponent(opts.model)}:generateContent`, {
				method: 'POST',
				headers: { 'content-type': 'application/json', 'x-goog-api-key': opts.apiKey },
				body: JSON.stringify({
					systemInstruction: { parts: [{ text: opts.system }] },
					contents: [{ role: 'user', parts: [{ text: opts.prompt }] }],
					generationConfig: { responseMimeType: 'application/json', responseSchema: opts.schema, temperature: 0.2 },
				}),
				signal: controller.signal,
			});
			clearTimeout(timer);
			const body = (await res.json().catch(() => null)) as Record<string, any> | null;
			if (!res.ok) {
				lastStatus = res.status;
				lastCode = typeof body?.error?.status === 'string' ? body.error.status : `HTTP_${res.status}`;
				const retryable = res.status === 429 || res.status >= 500;
				if (!retryable || attempt === maxAttempts) break;
				await sleep(1000 * 2 ** (attempt - 1) + Math.floor(Math.random() * 500));
				continue;
			}
			const candidate = body?.candidates?.[0];
			const text = (candidate?.content?.parts ?? []).map((p: { text?: string }) => p.text ?? '').join('');
			const usage = pickUsage(body?.usageMetadata);
			const finishReason = typeof candidate?.finishReason === 'string' ? candidate.finishReason : null;
			let json: unknown;
			try {
				json = JSON.parse(text);
			} catch {
				return { ok: false, status: res.status, code: finishReason === 'MAX_TOKENS' ? 'TRUNCATED_JSON' : 'INVALID_JSON', latencyMs: Date.now() - started, attempts: attempt, usage };
			}
			return { ok: true, json, usage, modelVersion: typeof body?.modelVersion === 'string' ? body.modelVersion : null, latencyMs: Date.now() - started, attempts: attempt, finishReason };
		} catch (error) {
			clearTimeout(timer);
			lastStatus = null;
			lastCode = error instanceof Error && error.name === 'AbortError' ? 'TIMEOUT' : 'NETWORK_ERROR';
			if (attempt === maxAttempts) break;
			await sleep(1000 * 2 ** (attempt - 1));
		}
	}
	return { ok: false, status: lastStatus, code: lastCode, latencyMs: Date.now() - started, attempts, usage: null };
}
