import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    verbose: true,
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(p-limit|yocto-queue)/)',
    ],
    rootDir: './tests',
    testRegex: '(.*\\.spec)\\.(jsx?|tsx?)$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testTimeout: 60000,
    testRunner: 'jasmine2',
};
export default config;
