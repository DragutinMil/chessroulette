const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');
const colors = require('tailwindcss/colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    join(
      __dirname,
      '{src,pages,components,app,templates,providers,lib,modules}/**/*!(*.stories|*.spec).{ts,tsx,html}'
    ),
    ...createGlobPatternsForDependencies(__dirname),
  ],
  theme: {
    extend: {
      colors: {
        // purple: '#5A20FE',

        green: {
          ...colors.green,
          500: 'rgb(217 217 217 / 0.2)',
          // '#07da63',
          600: 'rgba(7, 218, 99,0.76)',
          800: 'rgba(7, 218, 99)',
        },
         blue: {
          ...colors.blue,
         
          600: '#11c6d1',
         
        },
        yellow: {
          ...colors.yellow,
          100: 'rgba(200, 160, 125,0.1)',
          500: '#C8A07D',
          600: 'rgba(200, 160, 125,0.8)',
        },
        red: {
          ...colors.red,
          500: '#f2358d',
          600: 'rgba(242,53,141,0.8)',
        },

        purple: 'red',
        indigo: {
          ...colors.indigo,
          200: '#E7DFFF',
          300: '#BFA8FF',
          400: '#A383FF',
          500: '#5A20FE',
          600: '#410ED1',
          700: '#2E0899',
          900: '#C8A07D',
          1000: '#f2358d',
          1100: 'rgba(200, 160, 125, 0.85)',
          1200: 'rgba(200, 160, 125, 0.95)',
          1300: '#202122',
          1400: '#5c5e64',
          1500: '#6f7381',
          1600: '#11c6d1',
        },
        conversation: {
          100: 'rgba(255, 255, 255, 0.05)',
          200: 'rgba(255, 255, 255, 0.15)',
          300: 'rgba(255, 255, 255, 0.25)',
        },
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(0px)' },
          '50%': { opacity: 1, transform: 'translateY(-6px)' },
          '100%': { opacity: 0, transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-5px)' },
          '40%': { transform: 'translateX(5px)' },
          '60%': { transform: 'translateX(-5px)' },
          '80%': { transform: 'translateX(5px)' },
        },
      },
      boxShadow: {
        'green-soft': '0px 2px 10px 0px rgba(7, 218, 99, 0.1)',
      },
      backgroundImage: {
        'op-widget':
          'radial-gradient(61.84% 61.84% at 50% 131.62%, rgba(5, 135, 44, 0.2) 0%, #01210B 100%)',
      },
      animation: {
        fadeUp: 'fadeUp 1s ease-out',
        shake: 'shake 0.5s ease-in-out 6',
      },
    },
    // colors: {

    // },
  },
  safelist: [
    {
      pattern: /bg-*-.+/,
      variants: ['focus', 'hover', 'active'],
    },
  ],
  //   aspectRatio: {
  //     auto: 'auto',
  //     square: '1 / 1',
  //     video: '16 / 9',
  //     1: '1',
  //     2: '2',
  //     3: '3',
  //     4: '4',
  //     5: '5',
  //     6: '6',
  //     7: '7',
  //     8: '8',
  //     9: '9',
  //     10: '10',
  //     11: '11',
  //     12: '12',
  //     13: '13',
  //     14: '14',
  //     15: '15',
  //     16: '16',
  //   },
  // },
  // variants: {
  //   aspectRatio: ['responsive', 'hover']
  // },
  // corePlugins: {
  //   aspectRatio: false,
  // },
  // plugins: [require('@tailwindcss/aspect-ratio')],
  plugins: [],
};
