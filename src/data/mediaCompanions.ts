import type { UILanguage } from '../i18n/ui';

export type MediaCompanionLanguage = UILanguage | 'multi';
export type MediaCompanionStatus = 'idea' | 'draft' | 'review' | 'published' | 'archived';
export type MediaArtifactStatus = 'not-planned' | 'planned' | 'draft' | 'reviewed' | 'published';
export type LocalizedMediaText = Partial<Record<UILanguage, string>>;

export type MediaCompanionReview = {
	humanReviewed: boolean;
	reviewedAt: string | null;
	reviewer: string | null;
	aiDraftUsed: boolean;
};

export type MediaCompanionArtifacts = {
	blogPost: MediaArtifactStatus;
	libraryCards: MediaArtifactStatus;
	paperCards: MediaArtifactStatus;
	deck: MediaArtifactStatus;
	transcript: MediaArtifactStatus;
	newsletterDraft: MediaArtifactStatus;
};

export type MediaCompanion = {
	id: string;
	status: MediaCompanionStatus;
	title: LocalizedMediaText;
	description: LocalizedMediaText;
	language: MediaCompanionLanguage;
	updatedAt: string;
	videoUrl: string | null;
	companionPostId: string | null;
	resourceIds: string[];
	paperIds: string[];
	topicIds: string[];
	deckIds: string[];
	artifacts: MediaCompanionArtifacts;
	review: MediaCompanionReview;
};

export const mediaCompanions: MediaCompanion[] = [];
