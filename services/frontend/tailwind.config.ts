import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ground: 'var(--color-ground)',
        ground2: 'var(--color-ground2)',
        elevated: 'var(--color-elevated)',
        rule: 'var(--color-rule)',
        ruleSoft: 'var(--color-ruleSoft)',
        ink: 'var(--color-ink)',
        ink2: 'var(--color-ink2)',
        ink3: 'var(--color-ink3)',
        inkFaint: 'var(--color-inkFaint)',
        seal: 'var(--color-seal)',
        sealGlow: 'var(--color-sealGlow)',
        'st-respond': 'var(--color-st-respond)',
        'st-narrow': 'var(--color-st-narrow)',
        'st-flag': 'var(--color-st-flag)',
        'st-defer': 'var(--color-st-defer)',
        'st-explore': 'var(--color-st-explore)',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        body: ['Fraunces', 'Georgia', 'serif'],
        mono: ['Geist Mono', 'monospace'],
        sans: ['Geist', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'wide-1': '0.08em',
        'wide-2': '0.18em',
        'wide-3': '0.22em',
      },
      borderRadius: {
        pill: '999px',
      },
    },
  },
  plugins: [],
};

export default config;
