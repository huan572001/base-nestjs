import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    moduleFileExtensions: ['js', 'json', 'ts'],
    modulePaths: ['.'],
    testRegex: '.*\\.spec\\.ts$',
    transform: {
        '^.+\\.(t|j)s$': 'ts-jest',
    },
    collectCoverageFrom: ['src/**/*.(t|j)s'],
    coveragePathIgnorePatterns: ['src/config', 'src/constants', 'src/main.ts', 'src/shared', 'src/infra'],
    coverageDirectory: 'coverage',
    testEnvironment: 'node',
    moduleNameMapper: {
        "@config/(.*)": ["src/config/$1"],
        "@constants/(.*)": ["src/constants/$1"],
        "@models/(.*)": ["models/$1"],
        "@repo/(.*)": ["repositories/$1"],
        "@shared/(.*)": ["shared/$1"],
        "@infra/(.*)": ["infra/$1"],
        "@modules/(.*)": ["modules/$1"]
    },
};

export default config;