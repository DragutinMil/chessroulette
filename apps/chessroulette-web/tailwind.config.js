const { createGlobPatternsForDependencies } = require('@nx/react/tailwind');
const { join } = require('path');

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
    extend: {},
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
