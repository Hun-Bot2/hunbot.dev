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
				accent: {
					DEFAULT: 'var(--accent)',
					dark: '#ea580c',
					light: '#fb923c',
				},
				neural: {
					cyan: '#06b6d4',
					pink: '#ec4899',
				},
			},
			fontFamily: {
				serif: ['var(--font-serif)'],
				sans: ['var(--font-sans)'],
				mono: ['var(--font-mono)'],
			},
			animation: {
				'gradient-x': 'gradient-x 15s ease infinite',
				'gradient-y': 'gradient-y 15s ease infinite',
				'gradient-xy': 'gradient-xy 15s ease infinite',
			},
			keyframes: {
				'gradient-y': {
					'0%, 100%': {
						transform: 'translateY(-50%)',
					},
					'50%': {
						transform: 'translateY(50%)',
					},
				},
				'gradient-x': {
					'0%, 100%': {
						transform: 'translateX(-50%)',
					},
					'50%': {
						transform: 'translateX(50%)',
					},
				},
				'gradient-xy': {
					'0%, 100%': {
						transform: 'translate(-50%, -50%)',
					},
					'25%': {
						transform: 'translate(50%, -50%)',
					},
					'50%': {
						transform: 'translate(50%, 50%)',
					},
					'75%': {
						transform: 'translate(-50%, 50%)',
					},
				},
			},
		},
	},
	plugins: [],
} 