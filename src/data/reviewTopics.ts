export const reviewTopicGroups = [
	'Domain',
	'Method',
	'Task',
	'Concept',
	'Dataset',
	'Application',
	'Other',
] as const;

export type ReviewTopicGroup = (typeof reviewTopicGroups)[number];

export type ReviewTopicDefinition = {
	slug: string;
	label: string;
	group: ReviewTopicGroup;
	aliases?: readonly string[];
};

export type ResolvedReviewTopic = {
	slug: string;
	label: string;
	group: ReviewTopicGroup;
	known: boolean;
};

export type ReviewTopicStat = ResolvedReviewTopic & {
	count: number;
};

type ReviewTopicSource = {
	data: {
		tags?: readonly string[];
	};
};

export const reviewTopics = [
	{
		slug: 'nlp',
		label: 'NLP',
		group: 'Domain',
		aliases: ['Natural Language Processing'],
	},
	{
		slug: 'speech-ai',
		label: 'Speech AI',
		group: 'Domain',
		aliases: ['Speech', 'Speech Recognition', 'Spoken Language'],
	},
	{
		slug: 'social-computing',
		label: 'Social Computing',
		group: 'Domain',
		aliases: ['Computational Social Science'],
	},
	{
		slug: 'hci',
		label: 'HCI',
		group: 'Domain',
		aliases: ['Human-Computer Interaction', 'Human Computer Interaction'],
	},
	{
		slug: 'transformer',
		label: 'Transformer',
		group: 'Method',
		aliases: ['Transformers'],
	},
	{
		slug: 'attention',
		label: 'Attention',
		group: 'Concept',
		aliases: ['Self-Attention', 'Self Attention'],
	},
	{
		slug: 'sequence-modeling',
		label: 'Sequence Modeling',
		group: 'Task',
		aliases: ['Sequence-to-Sequence', 'Seq2Seq', 'Sequence To Sequence'],
	},
	{
		slug: 'pronunciation-assessment',
		label: 'Pronunciation Assessment',
		group: 'Task',
		aliases: ['Automatic Pronunciation Assessment', 'APA'],
	},
	{
		slug: 'asr',
		label: 'ASR',
		group: 'Task',
		aliases: ['Automatic Speech Recognition'],
	},
	{
		slug: 'online-communities',
		label: 'Online Communities',
		group: 'Application',
		aliases: ['Online Community'],
	},
	{
		slug: 'evaluation',
		label: 'Evaluation',
		group: 'Concept',
		aliases: ['Benchmarking', 'Metrics'],
	},
] as const satisfies readonly ReviewTopicDefinition[];

const groupRank = new Map<ReviewTopicGroup, number>(
	reviewTopicGroups.map((group, index) => [group, index]),
);

const topicLookup = new Map<string, ReviewTopicDefinition>();

for (const topic of reviewTopics) {
	registerTopicAlias(topic.slug, topic);
	registerTopicAlias(topic.label, topic);
	for (const alias of topic.aliases ?? []) {
		registerTopicAlias(alias, topic);
	}
}

export function normalizeReviewTopicSlug(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9가-힣ぁ-んァ-ヶ一-龯]+/g, '-')
		.replace(/^-+|-+$/g, '');
}

export function resolveReviewTopic(tag: string): ResolvedReviewTopic | null {
	const normalizedSlug = normalizeReviewTopicSlug(tag);
	if (!normalizedSlug) return null;

	const knownTopic = topicLookup.get(normalizedSlug);
	if (knownTopic) {
		return {
			slug: knownTopic.slug,
			label: knownTopic.label,
			group: knownTopic.group,
			known: true,
		};
	}

	return {
		slug: normalizedSlug,
		label: tag.trim(),
		group: 'Other',
		known: false,
	};
}

export function getReviewTopicsForTags(tags: readonly string[] = []): ResolvedReviewTopic[] {
	const seenSlugs = new Set<string>();
	const topics: ResolvedReviewTopic[] = [];

	for (const tag of tags) {
		const topic = resolveReviewTopic(tag);
		if (!topic || seenSlugs.has(topic.slug)) continue;

		seenSlugs.add(topic.slug);
		topics.push(topic);
	}

	return topics;
}

export function getReviewTopicStats(reviews: readonly ReviewTopicSource[]): ReviewTopicStat[] {
	const stats = new Map<string, ReviewTopicStat>();

	for (const review of reviews) {
		for (const topic of getReviewTopicsForTags(review.data.tags ?? [])) {
			const current = stats.get(topic.slug);
			if (current) {
				current.count += 1;
			} else {
				stats.set(topic.slug, { ...topic, count: 1 });
			}
		}
	}

	return Array.from(stats.values()).sort((a, b) => {
		if (b.count !== a.count) return b.count - a.count;
		const groupDelta = (groupRank.get(a.group) ?? 99) - (groupRank.get(b.group) ?? 99);
		if (groupDelta !== 0) return groupDelta;
		return a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
	});
}

function registerTopicAlias(value: string, topic: ReviewTopicDefinition) {
	const normalizedSlug = normalizeReviewTopicSlug(value);
	if (normalizedSlug) {
		topicLookup.set(normalizedSlug, topic);
	}
}
