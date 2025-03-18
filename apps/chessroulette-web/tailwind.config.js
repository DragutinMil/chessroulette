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
          1100: '#513c2a'
        },
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
