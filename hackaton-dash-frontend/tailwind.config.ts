import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#084964',
        secondary: '#f57853',
        turquoise: '#17bfc3',
        sunshine: '#ffbd4b',
        neutral: { 50: '#f8f5ef', 900: '#153f4e' },
      },
    },
  },
  plugins: [],
} satisfies Config;
