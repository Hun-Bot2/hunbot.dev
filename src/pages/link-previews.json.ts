import type { APIRoute } from 'astro';
import { getLinkPreviewPayload } from '../utils/link-previews-load';

// /link-previews.json — what the hover/focus preview card shows for each
// published on-site target (docs/decisions/site-structure.md, Revision
// 2026-10-23b). Static; fetched once, on a reader's first hover or focus.
export const GET: APIRoute = async () =>
	new Response(JSON.stringify(await getLinkPreviewPayload()), {
		headers: { 'Content-Type': 'application/json; charset=utf-8' },
	});
