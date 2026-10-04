/** @type {import('tailwindcss').Config} */
export default {
	content: [
		'./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}',
		'./public/**/*.html',
	],
	darkMode: 'class',
	theme: {
		extend: {
			colors: {
				// Atelier tokens (src/styles/tokens.css). They follow html.dark, so
				// templates need no `dark:` variants for these.
				paper: 'var(--paper)',
				'paper-deep': 'var(--paper-deep)',
				'paper-light': 'var(--paper-light)',
				ink: 'var(--ink)',
				secondary: 'var(--secondary)',
				faint: 'var(--faint)',
				rule: 'var(--rule)',
				'rule-strong': 'var(--rule-strong)',
				accent: 'var(--accent)',
			},
			fontFamily: {
				serif: ['var(--font-serif)'],
				sans: ['var(--font-sans)'],
				mono: ['var(--font-mono)'],
			},
		},
	},
	plugins: [],
} 