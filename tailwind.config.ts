import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import plugin from 'flowbite/plugin';

export default {
	content: [
		'./src/**/*.{html,js,svelte,ts}',
		'./node_modules/flowbite-svelte/**/*.{html,js,svelte,ts}'
	],
	plugins: [typography, plugin],
	darkMode: 'selector',

	theme: {
		extend: {
			zIndex: {
				'100': '100'
			},
			colors: {
				primary: {
					50: '#efffff',
					100: '#d4ffff',
					200: '#b8f3ff',
					300: '#9ddaff',
					400: '#82c1ff',
					500: '#66a9ff',
					600: '#227acc',
					700: '#004f9b',
					800: '#00286c',
					900: '#000040'
				},
				alternative: {
					50: '#ffecff',
					100: '#ffd7ff',
					200: '#ffc3f5',
					300: '#ffaee0',
					400: '#ff9acc',
					500: '#fc87b8',
					600: '#e673a5',
					700: '#b14376',
					800: '#7e094b',
					900: '#4d0023'
				}
			}
		}
	}
} satisfies Config;
