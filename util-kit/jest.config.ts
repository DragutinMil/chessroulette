import type { JestConfigWithTsJest } from 'ts-jest';

/* eslint-disable */
export default {
  displayName: 'util-kit',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/util-kit',
  // moduleNameMapper: {
  //   '^@app/(.*)$': '<rootDir>/apps/chessroulette-web/$1',
  //   '^@xmatter/util-kit$': '<rootDir>/util-kit/src/index.ts/$1',
  // },
} satisfies JestConfigWithTsJest;
