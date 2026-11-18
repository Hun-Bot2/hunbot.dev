export const coverMotifs = ['disclosure', 'research', 'reasoning', 'layers', 'intersect', 'pulse', 'abstract'] as const;
export type CoverMotif = typeof coverMotifs[number];

// Themes are assigned from article titles and headings. Translations generally share artwork.
const archiveMotifs: Record<string, CoverMotif> = {
	'notes/how2make_resume': 'layers',
	'paper/whitepaper_ai_frontier_2024': 'research',
	'paper-review/whitepaper_ai_frontier_2024': 'research',
	'paper/vision_language_models': 'intersect',
	'paper-review/vision_language_models': 'intersect',
	'paper-review/activation-function': 'pulse',
	'review/2025_capstone_hackathon': 'research',
	'personal_log/hrd01': 'layers',
	'personal_log/hrd02': 'intersect',
	'technical_note/공부': 'research',
	'devlog/blog/blog_develop_11': 'disclosure',
	'devlog/blog/blog_develop_13': 'intersect',
	'devlog/blog/blog_develop_14': 'layers',
	'devlog/jp_app/japan_hanashiapp_01': 'pulse',
	'devlog/on-the-block/on-the-block05': 'intersect',
	'ko/devlog/on-the-block/on-the-block05': 'reasoning',
	'devlog/on-the-block/on-the-block06': 'intersect',
	'devlog/on-the-block/on-the-block07': 'layers',
	'devlog/status_arc/statusarc_develop_01': 'disclosure',
	'devlog/data_automation/dacon-multimodal-bias01': 'intersect',
	'devlog/data_automation/dacon-multimodal-bias02': 'reasoning',
	'devlog/data_automation/dacon-multimodal-bias03': 'pulse',
	'devlog/fraud-review/fraud-review': 'intersect',
	'devlog/local_llm/snl_llm_01': 'layers',
	'study/linux/secure-boot': 'reasoning',
	'technical_note/database/pulmuone-race-condition': 'intersect',
	'technical_note/arduino/autocage/autocage-code-review-01': 'reasoning',
	'technical_note/kaggle/santander_product_recommendation/spr01': 'intersect',
};

export function resolveCoverMotif(id: string, authored?: CoverMotif): CoverMotif {
	return authored ?? archiveMotifs[id] ?? archiveMotifs[id.split('/').slice(1).join('/')] ?? 'abstract';
}
