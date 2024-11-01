import { pathsToModuleNameMapper } from 'ts-jest';
const { compilerOptions } = require('./tsconfig.json');

/* eslint-disable */
export default {
  displayName: 'chessroulette-web',
  preset: '../../jest.preset.js',
  transform: {
    '^(?!.*\\.(js|jsx|ts|tsx|css|json)$)': '@nx/react/plugins/jest',
    '^.+\\.[tj]sx?$': ['babel-jest', { presets: ['@nx/next/babel'] }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/apps/chessroulette-web',
  // moduleNameMapper: {
  //   '^@app/(.*)$': '<rootDir>/apps/chessroulette-web/$1',
  //   '^@xmatter/util-kit$': '<rootDir>/util-kit/src/index.ts/$1',
  // },
  roots: ['<rootDir>'],
  modulePaths: ['.'], // <-- This will be set to 'baseUrl' value
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths),
};
