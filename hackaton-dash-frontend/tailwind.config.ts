import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#176b58',
        secondary: '#e5a13f',
        neutral: { 50: '#fafafa', 900: '#17211e' },
      },
    },
  },
  plugins: [],
} satisfies Config;
