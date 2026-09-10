type ResponsiveVariant = {
	src: string;
	width: number;
};

type ResponsiveImageEntry = {
	width: number;
	height: number;
	webp: ResponsiveVariant[];
};

export type ResponsivePublicImage = {
	src: string;
	width?: number;
	height?: number;
	webpSrcSet?: string;
};

const responsiveImages: Record<string, ResponsiveImageEntry> = {
	'/images/ON-THE-BLOCK/otb-chatlist.webp': {
		width: 1206,
		height: 2622,
		webp: [
			{ src: '/images/responsive/home/otb-chatlist-192.webp', width: 192 },
			{ src: '/images/responsive/home/otb-chatlist-384.webp', width: 384 },
			{ src: '/images/responsive/home/otb-chatlist-640.webp', width: 640 },
			{ src: '/images/responsive/blog/otb-chatlist-768.webp', width: 768 },
			{ src: '/images/responsive/blog/otb-chatlist-960.webp', width: 960 },
			{ src: '/images/responsive/blog/otb-chatlist-1206.webp', width: 1206 },
		],
	},
	'/images/ON-THE-BLOCK/otb-chatroom.png': {
		width: 1206,
		height: 2622,
		webp: [
			{ src: '/images/responsive/home/otb-chatroom-192.webp', width: 192 },
			{ src: '/images/responsive/home/otb-chatroom-384.webp', width: 384 },
			{ src: '/images/responsive/home/otb-chatroom-640.webp', width: 640 },
			{ src: '/images/responsive/blog/otb-chatroom-768.webp', width: 768 },
			{ src: '/images/responsive/blog/otb-chatroom-960.webp', width: 960 },
			{ src: '/images/responsive/blog/otb-chatroom-1206.webp', width: 1206 },
		],
	},
	'/images/blank.png': {
		width: 2400,
		height: 1600,
		webp: [
			{ src: '/images/responsive/home/blank-320.webp', width: 320 },
			{ src: '/images/responsive/home/blank-640.webp', width: 640 },
			{ src: '/images/responsive/home/blank-960.webp', width: 960 },
		],
	},
};

export const homepagePostImageSizes = '(max-width: 640px) calc(100vw - 2rem), 6rem';
export const blogHeroImageSizes = '(min-width: 768px) 768px, calc(100vw - 3rem)';

export function getResponsivePublicImage(src: string): ResponsivePublicImage {
	const entry = responsiveImages[src];

	if (!entry) {
		return { src };
	}

	return {
		src,
		width: entry.width,
		height: entry.height,
		webpSrcSet: entry.webp.map((variant) => `${variant.src} ${variant.width}w`).join(', '),
	};
}
