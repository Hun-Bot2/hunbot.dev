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
				accent: {
					DEFAULT: '#a855f7',
					dark: '#7c3aed',
					light: '#c084fc',
				},
				neural: {
					cyan: '#06b6d4',
					pink: '#ec4899',
				},
			},
			fontFamily: {
				sans: ['Atkinson', 'system-ui', 'sans-serif'],
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