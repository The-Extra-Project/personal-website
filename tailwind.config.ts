/* eslint-disable ts/no-require-imports */
import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
          strong: 'hsl(var(--accent-strong))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* The section ground that already existed as `bg-slate-800`. */
        navy: {
          DEFAULT: 'hsl(var(--surface-navy))',
          foreground: 'hsl(var(--surface-navy-foreground))',
        },
        /* Brand ramps. These intentionally replace Tailwind's generic teal and
           emerald: the subject is terrain, and the palette should be ours. */
        teal: {
          50: 'hsl(var(--teal-50))',
          100: 'hsl(var(--teal-100))',
          300: 'hsl(var(--teal-300))',
          500: 'hsl(var(--teal-500))',
          700: 'hsl(var(--teal-700))',
          900: 'hsl(var(--teal-900))',
        },
        emerald: {
          50: 'hsl(var(--emerald-50))',
          300: 'hsl(var(--emerald-300))',
          500: 'hsl(var(--emerald-500))',
          700: 'hsl(var(--emerald-700))',
        },
        roadmap: {
          done: 'hsl(var(--roadmap-done))',
          now: 'hsl(var(--roadmap-now))',
          next: 'hsl(var(--roadmap-next))',
        },
      },
      fontFamily: {
        sans: ['var(--font-text)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', ...defaultTheme.fontFamily.sans],
        mono: ['var(--font-data)', ...defaultTheme.fontFamily.mono],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config;

export default config;
